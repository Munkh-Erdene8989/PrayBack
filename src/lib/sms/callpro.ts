const CALLPRO_API_URL = process.env.CALLPRO_API_URL!
const CALLPRO_API_KEY = process.env.CALLPRO_API_KEY!
const CALLPRO_SENDER_NAME = process.env.CALLPRO_SENDER_NAME || '72720880'

export const SMS_TEMPLATES = {
  ORDER_CONFIRMED: (orderNumber: string) => 
    `Таны ${orderNumber} дугаартай захиалга баталгаажлаа. Баярлалаа!`,
  
  ORDER_DELIVERED: (orderNumber: string) => 
    `Таны ${orderNumber} дугаартай захиалга амжилттай хүргэгдлээ. Баярлалаа!`,
  
  ORDER_CANCELLED: (orderNumber: string) => 
    `Таны ${orderNumber} дугаартай захиалга цуцлагдсан байна.`,
}

export async function sendSMS(params: {
  to: string
  message: string
}): Promise<boolean> {
  try {
    // CallPro (MessagePro) API - GET method with query params
    const url = new URL(CALLPRO_API_URL)
    url.searchParams.append('from', CALLPRO_SENDER_NAME)
    url.searchParams.append('to', params.to)
    url.searchParams.append('text', params.message)

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'x-api-key': CALLPRO_API_KEY,
      },
    })

    if (!response.ok) {
      console.error('Failed to send SMS:', response.status, response.statusText)
      return false
    }

    const result = await response.json()
    console.log('SMS sent successfully:', result)
    return true
  } catch (error) {
    console.error('Error sending SMS:', error)
    return false
  }
}

export async function sendOrderConfirmationSMS(phone: string, orderNumber: string): Promise<boolean> {
  return sendSMS({
    to: phone,
    message: SMS_TEMPLATES.ORDER_CONFIRMED(orderNumber),
  })
}

export async function sendOrderDeliveredSMS(phone: string, orderNumber: string): Promise<boolean> {
  return sendSMS({
    to: phone,
    message: SMS_TEMPLATES.ORDER_DELIVERED(orderNumber),
  })
}
