/**
 * InputQueue turns terminal text into messages the Claude Agent SDK can read one at a time. 
 * It keeps messages that arrive early in a queue, and lets the generator wait when there’s nothing to read yet.
 */

import type { SDKUserMessage } from "@anthropic-ai/claude-agent-sdk";

function createUserMessage(content: string): SDKUserMessage {
  return {
    type: "user",
    message: { role: "user", content },
    parent_tool_use_id: null,
  };
}

/**
 * Bridges terminal input to the SDK streaming input AsyncGenerator.
 * @see https://code.claude.com/docs/en/agent-sdk/streaming-vs-single-mode
 */
export class InputQueue {
  // stores messages that arrived before the generator was ready to receive them
  private pending: SDKUserMessage[] = [];

  // stores a promise callback when the generator is waiting for a message.
  private resolver: ((message: SDKUserMessage | null) => void) | null = null;

  // records whether the queue has been shut down
  private closed = false;

  // First, the string is converted into an SDK message. 
  // If the generator is already waiting (resolver exists), 
  // push clears the stored resolver and calls it with the message, immediately waking the wait.
  // Otherwise, it adds the message to pending for later.
  push(content: string): void {
    const message = createUserMessage(content);
    if (this.resolver) {
      const resolve = this.resolver;
      this.resolver = null;
      resolve(message);
    } else {
      this.pending.push(message);
    }
  }

  // Sets closed to true. If the generator is currently waiting, 
  // it resolves that wait with null, so the generator can stop. Then it clears resolver
  close(): void {
    this.closed = true;
    this.resolver?.(null);
    this.resolver = null;
  }

  
  // If messages are queued, it removes and returns the oldest one.
  // If the queue is closed and empty, it returns null immediately.
  // Otherwise, it creates a promise and saves its resolve callback in resolver. 
  // That promise stays pending until push supplies a message or close supplies null.
  private waitForMessage(): Promise<SDKUserMessage | null> {
    if (this.pending.length > 0) {
      // removes the first queued message, 
      // if the result is null or undefined, it uses null instead
      return Promise.resolve(this.pending.shift() ?? null);
    }
    if (this.closed) return Promise.resolve(null);

    return new Promise((resolve) => {
      this.resolver = resolve;
    });
  }

  // async * means the method can both await asynchronous work and yield values over time.
  // loop keeps requesting messages while the queue is open. Each iteration awaits waitForMessage(). 
  // If the result is null, it exits; otherwise, yield message delivers that message 
  // to the async-iterator consumer and pauses until the consumer asks for the next one.  
  async *generator(): AsyncGenerator<SDKUserMessage> {
    while (!this.closed) {
      const message = await this.waitForMessage();
      if (!message) break;
      yield message;
    }
  }

  // A caller can consume the messages with for await (const message of queue.generator()). Each push provides the next message, and close() ends the iteration.
}
