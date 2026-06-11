'use client'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import { Button, TextField } from '@mui/material'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import { initializeApp } from 'firebase/app'
import {
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  getAuth,
  setPersistence
} from 'firebase/auth'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useEffect, useRef, useState } from 'react'
import { Layout } from '../components/Sign-up-Layout'

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyDattKzm5aEhXGgLYqcXzJmYsnKcxMAGfE',
  authDomain: 'haste-c1520.firebaseapp.com',
  projectId: 'haste-c1520',
  storageBucket: 'haste-c1520.firebasestorage.app',
  messagingSenderId: '543961426186',
  appId: '1:543961426186:web:7dfcedecf1b7f375f2b2f3'
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

export default function Sign_up() {
  const PWD_REGEX =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[\p{P}\p{S}]).{8,24}$/
  const router = useRouter()
  const emailRef = useRef<HTMLInputElement>(null)
  const errRef = useRef<HTMLParagraphElement>(null)
  const [errMsg, setErrMsg] = useState('')

  const [email, setEmail] = useState('')
  const [invalidEmail, setInvalidEmail] = useState(false)
  const [emailFocus, setEmailFocus] = useState(false)

  const [pwd, setPwd] = useState('')
  const [invalidPwd, setInvalidPwd] = useState(false)
  const [pwdFocus, setPwdFocus] = useState(false)
  const [showPwd, setShowPwd] = useState(false)

  const [matchPwd, setMatchPwd] = useState('')
  const [invalidMatch, setInvalidMatch] = useState(false)
  const [matchFocus, setMatchFocus] = useState(false)
  const [showMatchPwd, setShowMatchPwd] = useState(false)

  useEffect(() => {
    if (emailRef.current) {
      emailRef.current.focus()
    }
  }, [])

  function getCookie(name: string) {
    if (!document.cookie) {
      return null
    }

    const xsrfCookies = document.cookie
      .split(';')
      .map((c) => c.trim())
      .filter((c) => c.startsWith(name + '='))

    if (xsrfCookies.length === 0) {
      return null
    }
    return decodeURIComponent(xsrfCookies[0].split('=')[1])
  }

  // Whenever submit button is clicked, check all states to see if fields are valid before calling to backend
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    // If all fields are valid, send values to backend and
    if (email && PWD_REGEX.test(pwd) && pwd === matchPwd) {
      const formData = new FormData(event.currentTarget)
      const email = formData.get('email') as string
      const password = formData.get('password') as string

      const auth = getAuth()

      // As httpOnly cookies are to be used, do not persist any state client side.
      setPersistence(auth, browserSessionPersistence)

      // When the user signs in with email and password.
      createUserWithEmailAndPassword(auth, email, password)
        .then((user) => {
          // Get the user's ID token as it is needed to exchange for a session cookie.
          return user.user?.getIdToken().then((idToken) => {
            // Session login endpoint is queried and the session cookie is set.
            // CSRF protection should be taken into account.
            const csrfToken = getCookie('csrfToken')
            fetch('http://localhost:3001/api/auth/sessionLogin', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken ?? '' // <-- sent as a custom header
              },
              credentials: 'include',
              next: { revalidate: false },
              body: JSON.stringify({ idToken })
            }).catch((error) => {
              setErrMsg('Error: ' + error.code + ' ' + error.message)
            })
          })
        })
        // .then(() => {
        //   // A page redirect would suffice as the persistence is set to NONE.
        //   return auth.signOut()
        // })
        .then(() => {
          window.location.assign('/home')
        })
        .catch((error) => {
          setErrMsg('Error: ' + error.code + ' ' + error.message)
        })
    }

    if (!email) {
      setInvalidEmail(true)
      setEmailFocus(true)
    } else {
      setInvalidEmail(false)
      setEmailFocus(false)
    }
    if (!PWD_REGEX.test(pwd)) {
      setInvalidPwd(true)
      setPwdFocus(true)
    } else {
      setInvalidPwd(false)
      setPwdFocus(false)
    }
    if (pwd !== matchPwd) {
      setInvalidMatch(true)
      setMatchFocus(true)
    } else {
      setInvalidMatch(false)
      setMatchFocus(false)
    }
  }

  return (
    <Layout>
      {/* Main parent element */}
      <section className='rounded-xs mt-10 flex h-[65vh] w-[28vw] flex-col items-center justify-center gap-9 self-center p-10 shadow-[0_0_2px_#b9b9b9]'>
        <h1 className='self-start pl-7 font-[family-name:DM_Serif_Text] text-4xl font-[505]'>
          Register
        </h1>
        <p ref={errRef} className='errmsg'>
          {errMsg}
        </p>

        {/* Main form */}
        <form
          className='flex w-[20vw] flex-col gap-4 text-[16px]'
          onSubmit={handleSubmit}
          noValidate
        >
          {/* Email field */}
          <TextField
            type='email'
            name='email'
            id='email'
            key='emailInput'
            autoComplete='on'
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setEmailFocus(true)}
            onBlur={() => setEmailFocus(false)}
            variant='standard'
            error={invalidEmail}
            helperText={emailFocus && 'Valid email address.'}
            slotProps={{ htmlInput: { ref: emailRef } }}
            label='Email address'
            required
          />

          {/* Password field */}
          <TextField
            type={showPwd ? 'text' : 'password'}
            name='password'
            onFocus={() => setPwdFocus(true)}
            id='password'
            onChange={(e) => setPwd(e.target.value)}
            onBlur={() => setPwdFocus(false)}
            onPaste={(e: any) => {
              e.preventDefault()
            }}
            variant='standard'
            error={invalidPwd}
            helperText={
              pwdFocus &&
              '8 to 24 characters. Must include uppercase and lowercase letters, a number, and a special character. Allowed special characters: !@#$%'
            }
            label='Password'
            slotProps={{
              input: {
                endAdornment: (
                  <>
                    {showPwd ? (
                      <InputAdornment position='end'>
                        <IconButton
                          onClick={(e) => {
                            setShowPwd(false)
                            e.preventDefault()
                            e.stopPropagation()
                          }}
                        >
                          <VisibilityOff />
                        </IconButton>
                      </InputAdornment>
                    ) : (
                      <InputAdornment position='end'>
                        <IconButton
                          onClick={(e) => {
                            setShowPwd(true)
                            e.preventDefault()
                            e.stopPropagation()
                          }}
                        >
                          <Visibility />
                        </IconButton>
                      </InputAdornment>
                    )}
                  </>
                )
              }
            }}
            required
          />

          {/* Confirm password field */}
          <TextField
            type={showMatchPwd ? 'text' : 'password'}
            id='confirm_pwd'
            onChange={(e) => setMatchPwd(e.target.value)}
            onFocus={() => setMatchFocus(true)}
            onBlur={() => setMatchFocus(false)}
            onPaste={(e: any) => {
              e.preventDefault()
            }}
            variant='standard'
            error={invalidMatch}
            helperText={
              matchFocus && 'Must match the first password input field.'
            }
            label='Confirm Password'
            slotProps={{
              input: {
                endAdornment: (
                  <>
                    {showMatchPwd ? (
                      <InputAdornment position='end'>
                        <IconButton
                          onClick={(e) => {
                            setShowMatchPwd(false)
                            e.preventDefault()
                            e.stopPropagation()
                          }}
                        >
                          <VisibilityOff />
                        </IconButton>
                      </InputAdornment>
                    ) : (
                      <InputAdornment position='end'>
                        <IconButton
                          onClick={(e) => {
                            setShowMatchPwd(true)
                            e.preventDefault()
                            e.stopPropagation()
                          }}
                        >
                          <Visibility />
                        </IconButton>
                      </InputAdornment>
                    )}
                  </>
                )
              }
            }}
            required
          />

          {/* Submit button */}
          <Button
            variant='text'
            className='w-full justify-self-center pt-2'
            size='large'
            type='submit'
            onMouseDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
          >
            Sign up
          </Button>
        </form>

        {/* Sign-in link */}
        <p className='self-start pl-7'>
          Already registered?
          <br />
          <Link className='hover:underline' href='/sign_in' prefetch={false}>
            Sign in
          </Link>
        </p>
      </section>
    </Layout>
  )
}
