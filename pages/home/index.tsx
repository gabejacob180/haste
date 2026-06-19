'use client'
import { getCookie } from 'cookies-next'
import { useEffect, useState } from 'react'
import { Layout } from '../components/Layout'

export default function Home() {
    const [uid, setUID] = useState('')
    const [email, setEmail] = useState('')

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(
                    'http://localhost:3000/api/auth/verifyToken',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ session: getCookie('session') })
                    }
                )

                if (!res.ok) {
                    window.location.assign('/sign-in')
                    return
                }

                const data = await res.json()
                setUID(data?.uid)
                setEmail(data?.email)
            } catch {
                window.location.assign('/sign-in')
            }
        }

        fetchData()
    }, [])

    return (
        <Layout>
            <div></div>
        </Layout>
    )
}
