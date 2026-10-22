// Reads successful responses into JSON, text, or Blob, and turns an HTTP error
// response into the SDK's typed error with the API's problem document intact.

import { TwextHubError } from './errors.js';

export function readResponse(response, options) {
  const responseType = options.responseType ?? 'json';
  if (responseType === 'raw') return response;
  if (response.status === 204 || response.status === 205) return undefined;
  if (responseType === 'none') return undefined;
  if (responseType === 'blob') return response.blob();
  return readTextOrJson(response, responseType, options);
}

async function readTextOrJson(response, responseType, options) {
  const text = await response.text();
  if (responseType === 'text') return text;
  if (text === '') return undefined;

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new TwextHubError(`Expected JSON from ${options.url ?? response.url}`, {
      status: response.status,
      method: options.method,
      url: options.url ?? response.url,
      headers: response.headers,
      body: text,
      cause: error
    });
  }
}

export async function buildHttpError(response, method, url) {
  const body = await response.text();
  let problem;
  if (body) {
    try {
      problem = JSON.parse(body);
    } catch {
      problem = undefined;
    }
  }

  const message = problemMessage(problem, response);
  const retryAfter = parseRetryAfter(response.headers.get('retry-after'));
  return new TwextHubError(message, {
    status: response.status,
    problem: problem && typeof problem === 'object' ? problem : undefined,
    method,
    url,
    headers: response.headers,
    retryAfter,
    body
  });
}

function problemMessage(problem, response) {
  let message = `Request failed with status ${response.status}`;
  if (response.statusText) {
    message += ` (${response.statusText})`;
  }
  if (!problem || typeof problem !== 'object') {
    return message;
  }
  if (typeof problem.detail === 'string' && problem.detail.length > 0) {
    message = problem.detail;
  } else if (typeof problem.title === 'string' && problem.title.length > 0) {
    message = problem.title;
  }
  if (Array.isArray(problem.errors) && problem.errors.length > 0) {
    const fields = problem.errors
      .map(function (entry) {
        return `${entry.field}: ${entry.message}`;
      })
      .join(', ');
    message += ` (${fields})`;
  }
  return message;
}

function parseRetryAfter(value) {
  if (!value) return undefined;
  const seconds = Number.parseInt(value, 10);
  if (!Number.isFinite(seconds) || seconds < 0) return undefined;
  return seconds;
}
