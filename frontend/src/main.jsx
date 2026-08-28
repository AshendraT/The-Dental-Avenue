import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { GoogleOAuthProvider } from '@react-oauth/google'

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '422868012066-1cbb2mqcbj33hd5sjupu6qrngd41pic5.apps.googleusercontent.com';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={clientId} locale="en">
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>,
)
export default {};
