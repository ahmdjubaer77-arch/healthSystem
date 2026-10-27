const aiService = require('../services/ai.service')
const { randomUUID } = require('node:crypto')

function getRequestId(req) {
  const suppliedId = req.get?.('x-request-id') || req.headers?.['x-request-id']
  return typeof suppliedId === 'string' && /^[\da-f]{8}-[\da-f]{4}-[1-8][\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(suppliedId)
    ? suppliedId
    : randomUUID()
}

function writeEvent(res, type, data) {
  if (!res.destroyed && !res.writableEnded) {
    res.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`)
  }
}

function createAiController(service = aiService) {
  return {
    async chat(req, res, next) {
      const requestId = getRequestId(req)
      const startedAt = performance.now()
      const abortController = new AbortController()
      const abortRequest = () => abortController.abort()
      const logTiming = () => {
        console.info(JSON.stringify({
          event: 'ai_request_timing',
          requestId,
          durationMs: Math.round(performance.now() - startedAt),
          statusCode: res.statusCode,
        }))
      }

      res.setHeader('X-Request-ID', requestId)
      req.once('aborted', abortRequest)
      res.once('close', () => {
        if (!res.writableEnded) abortRequest()
      })
      res.once('finish', logTiming)

      try {
        const request = aiService.classifyChatRequest(
          req.body?.message,
          req.body?.conversation,
          req.body?.language,
        )
        if (req.body?.consent !== true) {
          if (request.topic === 'urgent_support' || request.topic === 'medical_scope') {
            return await streamResponse(service.geminiService, request, requestId, abortController.signal, res)
          }

          const error = new Error('Confirm the data-use notice before sending a message.')
          error.statusCode = 400
          error.code = 'CONSENT_REQUIRED'
          throw error
        }

        return await streamResponse(service.geminiService, request, requestId, abortController.signal, res)
      } catch (error) {
        if (res.headersSent) {
          if (!abortController.signal.aborted) {
            writeEvent(res, 'error', {
              code: error.code || 'AI_UNAVAILABLE',
              message: error.message || 'The assistant is temporarily unavailable. Please try again later.',
            })
            res.end()
          }
          return
        }
        next(error)
      }
    },
  }
}

async function streamResponse(geminiService, request, requestId, signal, res) {
  res.status(200).set({
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  })
  res.flushHeaders?.()

  try {
    for await (const event of geminiService.stream(request, { requestId, signal })) {
      if (signal.aborted || res.destroyed) return
      writeEvent(res, event.type, { text: event.text })
    }

    if (!signal.aborted && !res.destroyed) {
      writeEvent(res, 'done', {
        language: request.language,
        urgent: request.topic === 'urgent_support',
      })
      res.end()
    }
  } catch (error) {
    if (signal.aborted || res.destroyed) return
    if (error.code !== 'AI_QUOTA_EXCEEDED') {
      console.warn(JSON.stringify({
        event: 'ai_request_error',
        requestId,
        code: error.code || 'AI_UNAVAILABLE',
        statusCode: error.statusCode || 503,
      }))
    }
    writeEvent(res, 'error', {
      code: error.code || 'AI_UNAVAILABLE',
      message: error.message || 'The assistant is temporarily unavailable. Please try again later.',
    })
    res.end()
  }
}

module.exports = { createAiController }
