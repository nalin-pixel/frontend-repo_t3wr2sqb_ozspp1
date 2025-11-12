import { useEffect, useMemo, useState } from 'react'

const API_BASE = import.meta.env.VITE_BACKEND_URL || ''

function ThreadForm({ onCreated }) {
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/threads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, author, content, category: category || null, tags: tags ? tags.split(',').map(t => t.trim()) : null })
      })
      const data = await res.json()
      if (res.ok) {
        setTitle(''); setAuthor(''); setContent(''); setCategory(''); setTags('')
        onCreated && onCreated(data.id)
      } else {
        alert(data.detail || 'Failed to create thread')
      }
    } catch (err) {
      alert('Network error creating thread')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input className="w-full border rounded px-3 py-2" placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} required />
      <div className="grid grid-cols-2 gap-3">
        <input className="border rounded px-3 py-2" placeholder="Your name" value={author} onChange={e=>setAuthor(e.target.value)} required />
        <input className="border rounded px-3 py-2" placeholder="Category (optional)" value={category} onChange={e=>setCategory(e.target.value)} />
      </div>
      <textarea className="w-full border rounded px-3 py-2" rows={4} placeholder="Write the opening post..." value={content} onChange={e=>setContent(e.target.value)} required />
      <input className="w-full border rounded px-3 py-2" placeholder="Tags (comma separated)" value={tags} onChange={e=>setTags(e.target.value)} />
      <button disabled={loading} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium px-4 py-2 rounded">{loading ? 'Posting...' : 'Start Thread'}</button>
    </form>
  )
}

function ReplyForm({ threadId, onCreated }) {
  const [author, setAuthor] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/threads/${threadId}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thread_id: threadId, author, content })
      })
      const data = await res.json()
      if (res.ok) {
        setAuthor(''); setContent('');
        onCreated && onCreated(data.id)
      } else {
        alert(data.detail || 'Failed to reply')
      }
    } catch (err) {
      alert('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <input className="border rounded px-3 py-2" placeholder="Your name" value={author} onChange={e=>setAuthor(e.target.value)} required />
      </div>
      <textarea className="w-full border rounded px-3 py-2" rows={3} placeholder="Write a reply..." value={content} onChange={e=>setContent(e.target.value)} required />
      <button disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium px-4 py-2 rounded">{loading ? 'Posting...' : 'Reply'}</button>
    </form>
  )
}

function ThreadList({ onOpen }) {
  const [threads, setThreads] = useState([])
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const qs = new URLSearchParams()
    if (q) qs.set('q', q)
    if (category) qs.set('category', category)
    const res = await fetch(`${API_BASE}/threads?${qs.toString()}`)
    const data = await res.json()
    setThreads(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input className="flex-1 border rounded px-3 py-2" placeholder="Search threads" value={q} onChange={e=>setQ(e.target.value)} />
        <input className="w-48 border rounded px-3 py-2" placeholder="Category" value={category} onChange={e=>setCategory(e.target.value)} />
        <button onClick={load} className="bg-gray-800 text-white px-4 rounded">Search</button>
      </div>
      {loading ? <div className="text-gray-500">Loading...</div> : (
        <ul className="divide-y">
          {threads.map(t => (
            <li key={t.id} className="py-3 flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg">{t.title}</h3>
                <div className="text-sm text-gray-500">by {t.author} {t.category ? `• ${t.category}` : ''}</div>
                {t.tags && <div className="mt-1 text-xs text-gray-600">{t.tags.join(', ')}</div>}
              </div>
              <button onClick={() => onOpen(t.id)} className="text-blue-600 hover:underline">Open</button>
            </li>
          ))}
          {threads.length === 0 && <li className="py-6 text-gray-500">No threads yet</li>}
        </ul>
      )}
    </div>
  )
}

function ThreadView({ threadId, onBack }) {
  const [thread, setThread] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const [tRes, pRes] = await Promise.all([
      fetch(`${API_BASE}/threads/${threadId}`),
      fetch(`${API_BASE}/threads/${threadId}/posts`)
    ])
    const tData = await tRes.json()
    const pData = await pRes.json()
    setThread(tData)
    setPosts(Array.isArray(pData) ? pData : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [threadId])

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-gray-600 hover:underline">← Back</button>
      {loading ? <div className="text-gray-500">Loading...</div> : thread && (
        <div className="space-y-6">
          <div className="bg-gray-50 border rounded p-4">
            <h2 className="text-2xl font-bold">{thread.title}</h2>
            <div className="text-sm text-gray-600">by {thread.author} {thread.category ? `• ${thread.category}` : ''}</div>
            <p className="mt-3 whitespace-pre-wrap">{thread.content}</p>
            {thread.tags && <div className="mt-2 text-xs text-gray-600">Tags: {thread.tags.join(', ')}</div>}
          </div>

          <div>
            <h3 className="font-semibold mb-2">Replies</h3>
            <div className="space-y-3">
              {posts.map(p => (
                <div key={p.id} className="border rounded p-3">
                  <div className="text-sm text-gray-600 mb-1">{p.author}</div>
                  <p className="whitespace-pre-wrap">{p.content}</p>
                </div>
              ))}
              {posts.length === 0 && <div className="text-gray-500">No replies yet</div>}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Write a reply</h3>
            <ReplyForm threadId={threadId} onCreated={() => load()} />
          </div>
        </div>
      )}
    </div>
  )
}

export default function Forum() {
  const [view, setView] = useState('list')
  const [openId, setOpenId] = useState(null)

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-sky-50 p-6">
      <div className="max-w-3xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Community Forum</h1>
        </header>

        {view === 'list' && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="order-2 md:order-1">
              <h2 className="text-xl font-semibold mb-3">All Threads</h2>
              <ThreadList onOpen={(id) => { setOpenId(id); setView('thread') }} />
            </div>
            <div className="order-1 md:order-2 bg-white/70 backdrop-blur border rounded p-4 shadow">
              <h2 className="text-xl font-semibold mb-3">Start a New Thread</h2>
              <ThreadForm onCreated={(id) => { setOpenId(id); setView('thread') }} />
            </div>
          </div>
        )}

        {view === 'thread' && (
          <div className="bg-white/70 backdrop-blur border rounded p-4 shadow">
            <ThreadView threadId={openId} onBack={() => setView('list')} />
          </div>
        )}
      </div>
    </div>
  )
}
