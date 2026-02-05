# Деплой на Vercel + Supabase

## 1) Создай базу в Supabase
1. Создай проект в Supabase.
2. Открой SQL Editor.
3. Выполни скрипт из файла `supabase/schema.sql`.

## 2) Настрой переменные окружения
В Vercel добавь переменную:
```
DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/DATABASE
```
Эту строку можно взять в Supabase в разделе Database → Connection string.

## 3) Деплой
Подключи репозиторий в Vercel:
- Build Command: `npm run build`
- Output Directory: `dist`

## 4) Локальный запуск с Supabase
Создай файл `.env` на базе `.env.example` и вставь `DATABASE_URL`, затем:
```bash
npm install
npm run dev
```
