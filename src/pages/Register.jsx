import React, { useState } from 'react'
import axios from 'axios'
import { useI18n } from '../i18n'
import { useModal } from '../components/ModalProvider'
import { getErrorText } from '../utils/error'

export default function Register(){
  const { t } = useI18n()
  const { showAlert } = useModal()
  const [name,setName]=useState('')
  const [country,setCountry]=useState('+996')
  const [phone,setPhone]=useState('')

  const register = async ()=>{
    try {
      if(!phone) {
        showAlert(t('auth.enterPhone'))
        return
      }
      const res = await axios.post('/api/users/login',{ name, phone: country+phone })
      localStorage.setItem('user', JSON.stringify(res.data))
      window.location.href='/'
    } catch (err) {
      showAlert(getErrorText(err), { title: t('common.error') })
    }
  }

  return (
    <div className="container">
      <h2>{t('auth.register')}</h2>
      <div className="form">
        <input placeholder={t('auth.enterName')} value={name} onChange={e=>setName(e.target.value)} required />
        <div style={{display:'flex',gap:8}}>
          <select value={country} onChange={e=>setCountry(e.target.value)}>
            <option value="+996">Kyrgyzstan +996</option>
            <option value="+7">Russia +7</option>
            <option value="+998">Uzbekistan +998</option>
          </select>
          <input placeholder={t('auth.enterPhone')} value={phone} onChange={e=>setPhone(e.target.value)} type="tel" required />
        </div>
        <button className="btn-primary" onClick={register}>{t('auth.register')}</button>
      </div>
    </div>
  )
}
