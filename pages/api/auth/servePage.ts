import * as cookie from 'cookie'
import type { NextApiRequest, NextApiResponse } from 'next'

type Data = {
    message: string
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Data>
) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET'])
        return res.status(405).end(`Method ${req.method} Not Allowed`)
    }

    try {
        const response = await fetch(
            `${process.env.PRIVATE_BACKEND_URL}/api/auth/servePage`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.BACKEND_API_KEY}`
                }
            }
        )

        if (!response.ok) {
            throw new Error(`Backend responded with ${response.status}`)
        }

        const data = await response.json()

        const serializedCookie = cookie.serialize('csrfToken', data.csrfToken, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7,
            path: '/'
        })

        res.setHeader('Set-Cookie', serializedCookie)
        return res.status(200).json({ message: 'success' })
    } catch {
        return res.status(500).json({ message: 'Failed' })
    }
}
