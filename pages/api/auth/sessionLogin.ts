import * as cookie from 'cookie'
import type { NextApiRequest, NextApiResponse } from 'next'

type Data = {
    message: string
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Data>
) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST'])
        return res.status(405).end(`Method ${req.method} Not Allowed`)
    }

    try {
        const response = await fetch(
            `${process.env.PRIVATE_BACKEND_URL}/api/auth/sessionLogin`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${process.env.BACKEND_API_KEY}`,
                    'X-Csrf-Token':
                        (req.headers['x-csrf-token'] as string) ?? '',
                    Cookie: `csrfToken=${req.cookies['csrfToken']}`
                },
                body: JSON.stringify(req.body)
            }
        )

        if (!response.ok) {
            throw new Error(`Backend responded with ${response.status}`)
        }

        const data = await response.json()
        const serializedCookie = cookie.serialize('session', data.session, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 14,
            path: '/'
        })

        res.setHeader('Set-Cookie', serializedCookie)
        return res.redirect(303, '/home')
    } catch (error) {
        console.log('hit last catch, ' + error)
        return res.status(500).json({ message: 'Failed' })
    }
}
