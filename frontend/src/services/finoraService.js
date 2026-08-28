import api from "../api/axios";

// Mirrors the backend's own cap (finora/serializers.py: MAX_HISTORY_TURNS)
// so a long-running conversation degrades gracefully client-side instead
// of failing the request outright. Trimming keeps the most recent turns.
const MAX_HISTORY_TURNS = 20;

/**
 * Sends a single conversational turn to the Finora backend.
 *
 * This function performs no financial calculations and never talks to
 * Gemini directly - it only forwards what the user typed, the prior
 * conversation turns, and (when available) the currently selected date
 * range, then returns the backend's response unchanged.
 */
export const sendFinoraMessage = async ({ message, history = [], dateFrom, dateTo }) => {
  const trimmedHistory = history.length > MAX_HISTORY_TURNS ? history.slice(-MAX_HISTORY_TURNS) : history;

  const payload = {
    message,
    history: trimmedHistory,
  };

  if (dateFrom && dateTo) {
    payload.date_from = dateFrom;
    payload.date_to = dateTo;
  }

  const response = await api.post("finora/chat/", payload);
  return response.data;
};
