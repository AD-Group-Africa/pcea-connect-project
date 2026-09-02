"use client"
import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import api from "@/lib/api"
import { getUserId } from "@/lib/auth"
import { BookOpen, Bookmark, Highlighter, PenTool, Calendar, Heart, Share2, Play, Flame } from "lucide-react"

interface Book { id: string; name: string; testament: string }
interface Verse { id: string; bookId: string; chapter: number; verse: number; text: string; translation: string; audioUrl: string }
interface BookmarkData { id: string; bookId: string; chapter: number; verse: number; label: string }
interface HighlightData { id: string; verseId: string; color: string }
interface NoteData { id: string; verseId: string; content: string; createdAt: string }
interface PlanData { id: string; name: string; description: string; days: number }
interface ProgressData { planId: string; currentDay: number; completed: boolean }
interface Devotional { title: string; verseRef: string; content: string; author: string; date: string }

export default function BiblePage() {
  const [mounted, setMounted] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [books, setBooks] = useState<Book[]>([])
  const [selectedBook, setSelectedBook] = useState("book-joh")
  const [chapter, setChapter] = useState(3)
  const [verses, setVerses] = useState<Verse[]>([])
  const [loading, setLoading] = useState(true)
  const [bookmarks, setBookmarks] = useState<BookmarkData[]>([])
  const [highlights, setHighlights] = useState<HighlightData[]>([])
  const [notes, setNotes] = useState<NoteData[]>([])
  const [plans, setPlans] = useState<PlanData[]>([])
  const [progress, setProgress] = useState<ProgressData | null>(null)
  const [devotional, setDevotional] = useState<Devotional | null>(null)
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    setMounted(true)
    const uid = getUserId()
    setUserId(uid)
    if (!uid) { setLoading(false); return }
    Promise.all([
      api.get("/api/bible/books"),
      api.get("/api/bible/bookmarks"),
      api.get("/api/bible/highlights"),
      api.get("/api/bible/plans"),
      api.get("/api/bible/devotional"),
      api.get("/api/bible/reading-streak")
    ]).then(([booksRes, bookmarksRes, highlightsRes, plansRes, devotionalRes, streakRes]) => {
      setBooks(booksRes.data.data || [])
      setBookmarks(bookmarksRes.data.data || [])
      setHighlights(highlightsRes.data.data || [])
      setPlans(plansRes.data.data || [])
      setDevotional(devotionalRes.data.data)
      setStreak(streakRes.data.data?.streak || 0)
    }).catch(console.error)
    loadChapter(selectedBook, chapter)
  }, [])

  const loadChapter = async (bookId: string, ch: number) => {
    setLoading(true)
    const res = await api.get(`/api/bible/verses/${bookId}/${ch}`)
    setVerses(res.data.data || [])
    setLoading(false)
    if (userId) { api.post("/api/bible/reading-streak").then(r => setStreak(r.data.data?.streak || 0)) }
  }

  const handleAddBookmark = async (verse: Verse) => {
    if (!userId) return
    await api.post("/api/bible/bookmarks", { bookId: verse.bookId, chapter: verse.chapter, verse: verse.verse, label: "" })
    const res = await api.get("/api/bible/bookmarks")
    setBookmarks(res.data.data || [])
  }

  const handleAddHighlight = async (verseId: string) => {
    if (!userId) return
    await api.post("/api/bible/highlights", { verseId, color: "#FFEB3B" })
    const res = await api.get("/api/bible/highlights")
    setHighlights(res.data.data || [])
  }

  const handleShareVerse = (verse: Verse) => {
    if (navigator.share) {
      navigator.share({ title: 'Bible Verse', text: `${verse.text} - ${verse.translation}` })
    } else {
      prompt("Copy this verse:", `${verse.text} (${verse.translation})`)
    }
  }

  useEffect(() => {
    if (selectedBook && chapter) loadChapter(selectedBook, chapter)
  }, [selectedBook, chapter])

  if (!mounted || !userId) return null

  return (
    <div className="space-y-6 text-white">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Bible</h1>
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          <span className="font-bold">{streak} day streak</span>
        </div>
      </div>
      <Tabs defaultValue="read" className="w-full">
        <TabsList className="mb-4 bg-gray-800">
          <TabsTrigger value="read" className="text-gray-300 data-[state=active]:text-white"><BookOpen className="h-4 w-4 mr-2" /> Read</TabsTrigger>
          <TabsTrigger value="bookmarks" className="text-gray-300 data-[state=active]:text-white"><Bookmark className="h-4 w-4 mr-2" /> Bookmarks</TabsTrigger>
          <TabsTrigger value="plans" className="text-gray-300 data-[state=active]:text-white"><Calendar className="h-4 w-4 mr-2" /> Plans</TabsTrigger>
          <TabsTrigger value="devotional" className="text-gray-300 data-[state=active]:text-white"><Heart className="h-4 w-4 mr-2" /> Devotional</TabsTrigger>
        </TabsList>
        <TabsContent value="read">
          <div className="flex gap-4 mb-4 flex-wrap">
            <Select value={selectedBook} onValueChange={setSelectedBook}>
              <SelectTrigger className="w-48 bg-gray-800 border-gray-700 text-white"><SelectValue /></SelectTrigger>
              <SelectContent>{books.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
            </Select>
            <Input type="number" value={chapter} onChange={(e) => setChapter(parseInt(e.target.value) || 1)} className="w-24 bg-gray-800 border-gray-700 text-white" />
          </div>
          <div className="space-y-2">
            {loading ? <Skeleton className="h-64" /> : verses.map(v => (
              <Card key={v.id} className="bg-[#1E293B] border-0 shadow-lg group">
                <CardContent className="p-4 flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{v.verse}. {v.text}</p>
                    <p className="text-xs text-gray-400 mt-1">{v.translation}</p>
                    {v.audioUrl && (<audio controls className="mt-2 h-8 w-full"><source src={v.audioUrl} type="audio/mpeg" /></audio>)}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <Button size="icon" variant="ghost" onClick={() => handleAddBookmark(v)} className="text-gray-400 hover:text-white"><Bookmark className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => handleAddHighlight(v.id)} className="text-gray-400 hover:text-white"><Highlighter className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="text-gray-400 hover:text-white"><PenTool className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => handleShareVerse(v)} className="text-gray-400 hover:text-white"><Share2 className="h-4 w-4" /></Button>
                    {v.audioUrl && <Button size="icon" variant="ghost" className="text-gray-400 hover:text-white"><Play className="h-4 w-4" /></Button>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="bookmarks">
          {bookmarks.length === 0 ? <p className="text-gray-400">No bookmarks yet.</p> : bookmarks.map(bm => (
            <Card key={bm.id} className="bg-[#1E293B] border-0 shadow-lg mb-2"><CardContent className="p-4 text-white">{bm.label || `Book ${bm.bookId} ${bm.chapter}:${bm.verse}`}</CardContent></Card>
          ))}
        </TabsContent>
        <TabsContent value="plans">
          <div className="space-y-4">
            {plans.map(p => (
              <Card key={p.id} className="bg-[#1E293B] border-0 shadow-lg">
                <CardHeader><CardTitle className="text-white">{p.name}</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-400">{p.description}</p>
                  <Button className="mt-2 bg-blue-600 hover:bg-blue-700" onClick={async () => { await api.post(`/api/bible/plans/${p.id}/start`); const res = await api.get(`/api/bible/plans/${p.id}/progress`); setProgress(res.data.data) }}>Start / Continue</Button>
                  {progress && progress.planId === p.id && <p className="text-sm mt-2 text-gray-300">Day {progress.currentDay} of {p.days}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="devotional">
          {devotional ? (
            <Card className="bg-[#1E293B] border-0 shadow-lg">
              <CardHeader><CardTitle className="text-white">{devotional.title}</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm font-medium text-gray-300">{devotional.verseRef}</p>
                <p className="mt-2 text-gray-400">{devotional.content}</p>
                <p className="text-xs text-gray-500 mt-4">— {devotional.author}, {devotional.date}</p>
              </CardContent>
            </Card>
          ) : <p className="text-gray-400">No devotional for today.</p>}
        </TabsContent>
      </Tabs>
    </div>
  )
}
