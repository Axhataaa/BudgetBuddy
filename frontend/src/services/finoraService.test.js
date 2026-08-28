import { describe, it, expect, beforeEach, afterEach } from "vitest";
import MockAdapter from "axios-mock-adapter";
import api from "../api/axios";
import { sendFinoraMessage } from "./finoraService";

describe("finoraService.sendFinoraMessage", () => {
  let mock;

  beforeEach(() => {
    mock = new MockAdapter(api);
  });

  afterEach(() => {
    mock.restore();
  });

  it("posts to finora/chat/ with the message and history unchanged", async () => {
    let capturedBody;
    mock.onPost("finora/chat/").reply((config) => {
      capturedBody = JSON.parse(config.data);
      return [200, { status: "ok", reply: "You're doing fine.", scenario: null }];
    });

    const history = [
      { role: "user", content: "How am I doing?" },
      { role: "assistant", content: "You're doing fine." },
    ];

    await sendFinoraMessage({
      message: "What about next month?",
      history,
      dateFrom: "2026-08-01",
      dateTo: "2026-08-28",
    });

    expect(capturedBody.message).toBe("What about next month?");
    expect(capturedBody.history).toEqual(history);
    expect(capturedBody.date_from).toBe("2026-08-01");
    expect(capturedBody.date_to).toBe("2026-08-28");
  });

  it("sends the message exactly as typed, without translating or normalizing it", async () => {
    let capturedBody;
    mock.onPost("finora/chat/").reply((config) => {
      capturedBody = JSON.parse(config.data);
      return [200, { status: "ok", reply: "ok", scenario: null }];
    });

    const mixedLanguageMessage = "Is mahine mera kharcha zyada tha kya? Compare to last month please.";

    await sendFinoraMessage({ message: mixedLanguageMessage, history: [] });

    expect(capturedBody.message).toBe(mixedLanguageMessage);
  });

  it("omits date_from/date_to when not provided", async () => {
    let capturedBody;
    mock.onPost("finora/chat/").reply((config) => {
      capturedBody = JSON.parse(config.data);
      return [200, { status: "ok", reply: "ok", scenario: null }];
    });

    await sendFinoraMessage({ message: "Hello", history: [] });

    expect(capturedBody.date_from).toBeUndefined();
    expect(capturedBody.date_to).toBeUndefined();
  });

  it("trims history to the most recent 20 turns before sending", async () => {
    let capturedBody;
    mock.onPost("finora/chat/").reply((config) => {
      capturedBody = JSON.parse(config.data);
      return [200, { status: "ok", reply: "ok", scenario: null }];
    });

    const longHistory = Array.from({ length: 25 }, (_, i) => ({
      role: i % 2 === 0 ? "user" : "assistant",
      content: `turn ${i}`,
    }));

    await sendFinoraMessage({ message: "latest question", history: longHistory });

    expect(capturedBody.history).toHaveLength(20);
    expect(capturedBody.history[0].content).toBe("turn 5");
    expect(capturedBody.history[19].content).toBe("turn 24");
  });

  it("returns the backend response unchanged", async () => {
    const backendResponse = {
      status: "ok",
      reply: "Here's your summary.",
      currency: "INR",
      period: { from: "2026-08-01", to: "2026-08-28" },
      has_activity: true,
      scenario: null,
    };
    mock.onPost("finora/chat/").reply(200, backendResponse);

    const result = await sendFinoraMessage({ message: "Summarize my month", history: [] });

    expect(result).toEqual(backendResponse);
  });

  it("propagates an unavailable status response unchanged", async () => {
    const unavailableResponse = { status: "unavailable", message: "Finora is temporarily unavailable." };
    mock.onPost("finora/chat/").reply(200, unavailableResponse);

    const result = await sendFinoraMessage({ message: "Hello", history: [] });

    expect(result).toEqual(unavailableResponse);
  });

  it("propagates a network/HTTP failure", async () => {
    mock.onPost("finora/chat/").reply(500, { detail: "Server error" });

    await expect(sendFinoraMessage({ message: "Hello", history: [] })).rejects.toBeTruthy();
  });
});
