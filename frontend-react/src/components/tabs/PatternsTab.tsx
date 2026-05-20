import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPatternNotes, updatePatternNote, patternChat } from '../../api/client'
import { PatternNote } from '../../types'
import RichEditor from '../shared/RichEditor'

const PATTERNS = [
  { id: 'Array', label: '🔢 Array' },
  { id: 'Binary Search', label: '🔍 Binary Search' },
  { id: 'DP', label: '🧮 DP' },
  { id: 'Graphs', label: '🕸 Graphs' },
  { id: 'Greedy', label: '💰 Greedy' },
  { id: 'Heap', label: '⛰ Heap' },
  { id: 'Stack', label: '📚 Stack' },
  { id: 'String', label: '🔤 String' },
]

interface ChatMsg {
  role: 'user' | 'assistant'
  content: string
}

export default function PatternsTab() {
  const [activePattern, setActivePattern] = useState('Array')
  const qc = useQueryClient()

  const { data: notes = [] } = useQuery<PatternNote[]>({
    queryKey: ['pattern-notes'],
    queryFn: getPatternNotes,
  })

  const currentNote = notes.find((n) => n.pattern === activePattern) ?? {
    pattern: activePattern,
    notes: '',
    memory_techniques: '',
  }

  return (
    <div>
      {/* Pattern tab nav */}
      <div className="flex gap-2 flex-wrap mb-5">
        {PATTERNS.map((p) => (
          <button
            key={p.id}
            onClick={() => setActivePattern(p.id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              activePattern === p.id
                ? 'text-white shadow-md'
                : 'bg-white border border-rose-300 text-rose-600 hover:bg-rose-100'
            }`}
            style={activePattern === p.id ? { background: 'linear-gradient(135deg,#e11d48,#be123c)' } : undefined}
          >
            {p.label}
          </button>
        ))}
      </div>

      <PatternView
        key={activePattern}
        pattern={activePattern}
        note={currentNote}
        onSaved={() => qc.invalidateQueries({ queryKey: ['pattern-notes'] })}
      />
    </div>
  )
}

function renderMd(text: string): string {
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const inline = (s: string) =>
    esc(s)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code class="bg-gray-100 text-rose-600 px-1 py-0.5 rounded text-[11px] font-mono">$1</code>')

  const lines = text.split('\n')
  let html = ''
  let inCode = false
  let codeLines: string[] = []
  let inUl = false
  let inOl = false

  const closeList = () => {
    if (inUl) { html += '</ul>'; inUl = false }
    if (inOl) { html += '</ol>'; inOl = false }
  }

  for (const line of lines) {
    if (line.startsWith('```')) {
      if (!inCode) { closeList(); codeLines = []; inCode = true }
      else {
        html += `<pre class="bg-gray-900 text-green-300 text-xs p-3 rounded-xl overflow-x-auto font-mono my-2 leading-relaxed whitespace-pre"><code>${esc(codeLines.join('\n'))}</code></pre>`
        inCode = false
      }
      continue
    }
    if (inCode) { codeLines.push(line); continue }
    if (!line.trim()) { closeList(); html += '<div class="h-2"></div>'; continue }
    if (line.startsWith('## ')) { closeList(); html += `<h3 class="font-bold text-sm text-rose-700 mt-3 mb-1 border-b border-rose-200 pb-0.5">${inline(line.slice(3))}</h3>`; continue }
    if (line.startsWith('### ')) { closeList(); html += `<h4 class="font-semibold text-sm text-rose-600 mt-2 mb-0.5">${inline(line.slice(4))}</h4>`; continue }
    if (/^[-*] /.test(line)) {
      if (inOl) { html += '</ol>'; inOl = false }
      if (!inUl) { html += '<ul class="list-disc pl-5 space-y-0.5 my-1">'; inUl = true }
      html += `<li class="text-sm text-gray-700 leading-relaxed">${inline(line.slice(2))}</li>`; continue
    }
    if (/^\d+\. /.test(line)) {
      if (inUl) { html += '</ul>'; inUl = false }
      if (!inOl) { html += '<ol class="list-decimal pl-5 space-y-0.5 my-1">'; inOl = true }
      html += `<li class="text-sm text-gray-700 leading-relaxed">${inline(line.replace(/^\d+\. /, ''))}</li>`; continue
    }
    closeList()
    html += `<p class="text-sm text-gray-700 leading-relaxed">${inline(line)}</p>`
  }
  closeList()
  return html
}

function PatternView({
  pattern,
  note,
  onSaved,
}: {
  pattern: string
  note: PatternNote
  onSaved: () => void
}) {
  const [notes, setNotes] = useState(note.notes ?? '')
  const [memo, setMemo] = useState(note.memory_techniques ?? '')
  const [dirty, setDirty] = useState(false)
  const [editMode, setEditMode] = useState(!note.notes)
  const [chatHistory, setChatHistory] = useState<ChatMsg[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!dirty) {
      setNotes(note.notes ?? '')
      setMemo(note.memory_techniques ?? '')
      if (note.notes) setEditMode(false)
    }
  }, [note.notes, note.memory_techniques])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory, chatLoading])

  const save = useMutation({
    mutationFn: () => updatePatternNote(pattern, notes, memo),
    onSuccess: () => { setDirty(false); setEditMode(false); onSaved() },
  })

  const sendChat = async () => {
    if (!chatInput.trim()) return
    const msg = chatInput.trim()
    setChatInput('')
    const newHistory = [...chatHistory, { role: 'user' as const, content: msg }]
    setChatHistory(newHistory)
    setChatLoading(true)
    try {
      const res = await patternChat(pattern, msg)
      setChatHistory([...newHistory, { role: 'assistant', content: res.reply ?? res.message ?? '' }])
    } catch {
      setChatHistory([...newHistory, { role: 'assistant', content: '⚠️ Failed to get response.' }])
    } finally {
      setChatLoading(false)
    }
  }

  const info = PATTERN_INFO[pattern]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: reference info */}
      <div className="space-y-4">
        {info && (
          <>
            <div className="bg-white border border-rose-300 rounded-2xl p-5 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-widest text-rose-600 mb-3">
                🧭 Core Strategy
              </h3>
              <ul className="space-y-1.5">
                {info.strategy.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-rose-500 mt-0.5 flex-shrink-0">▸</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white border border-rose-300 rounded-2xl p-5 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-widest text-rose-600 mb-3">
                ⚠ Common Pitfalls
              </h3>
              <ul className="space-y-1.5">
                {info.pitfalls.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-rose-500 mt-0.5 flex-shrink-0">•</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            {info.templates && info.templates.length > 0 && (
              <div className="bg-white border border-rose-300 rounded-2xl p-5 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-widest text-rose-600 mb-3">
                  💻 Templates
                </h3>
                {info.templates.map((t, i) => (
                  <div key={i} className="mb-3">
                    <p className="text-xs font-semibold text-rose-500 mb-1">{t.name}</p>
                    <pre className="bg-gray-900 text-green-300 text-xs p-3 rounded-xl overflow-x-auto font-mono leading-relaxed">
                      {t.code}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Right: personal notes + AI chat */}
      <div className="space-y-4">
        {/* My Notes — rich editor */}
        <div className="bg-white border border-rose-300 rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-rose-600">📝 My Notes</h3>
            <button
              onClick={() => setEditMode(!editMode)}
              className="text-xs text-rose-500 hover:text-rose-700 font-semibold"
            >
              {editMode ? '👁 Preview' : '✏ Edit'}
            </button>
          </div>
          <div className="px-2 pb-3">
            <RichEditor
              content={notes}
              onChange={(html) => { setNotes(html); setDirty(true) }}
              placeholder={`Write your notes on ${pattern}… use the toolbar for formatting`}
              editable={editMode}
            />
          </div>
        </div>

        {/* Memory Techniques — rich editor */}
        <div className="bg-white border border-rose-300 rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-rose-600">🧠 Memory Techniques</h3>
            <button
              onClick={() => setEditMode(!editMode)}
              className="text-xs text-rose-500 hover:text-rose-700 font-semibold"
            >
              {editMode ? '👁 Preview' : '✏ Edit'}
            </button>
          </div>
          <div className="px-2 pb-3">
            <RichEditor
              content={memo}
              onChange={(html) => { setMemo(html); setDirty(true) }}
              placeholder="Write mnemonics, stories, or memory tricks…"
              editable={editMode}
            />
          </div>
        </div>

        {dirty && (
          <button
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="w-full py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg,#e11d48,#be123c)' }}
          >
            {save.isPending ? 'Saving…' : '💾 Save Notes'}
          </button>
        )}

        {/* AI chat */}
        <div className="bg-white border border-rose-300 rounded-2xl p-5 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-widest text-rose-600 mb-3">
            💬 AI Pattern Coach
          </h3>

          <div className="space-y-3 h-[480px] overflow-y-auto mb-3 pr-1 scrollbar-thin">
            {chatHistory.length === 0 && (
              <p className="text-xs text-gray-400 italic text-center pt-8">
                Ask anything about the {pattern} pattern — strategy, edge cases, problem variants…
              </p>
            )}
            {chatHistory.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                {m.role === 'user' ? (
                  <div className="max-w-[80%] bg-rose-600 text-white text-xs rounded-2xl rounded-tr-sm px-4 py-2.5 leading-relaxed shadow-sm">
                    {m.content}
                  </div>
                ) : (
                  <div className="max-w-[90%] bg-gray-50 border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                    <div
                      className="space-y-1"
                      dangerouslySetInnerHTML={{ __html: renderMd(m.content) }}
                    />
                  </div>
                )}
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-50 border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <span className="flex gap-1 items-center text-gray-400 text-xs">
                    <span className="animate-bounce delay-0">●</span>
                    <span className="animate-bounce delay-150">●</span>
                    <span className="animate-bounce delay-300">●</span>
                  </span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="flex gap-2 items-end">
            <textarea
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat() } }}
              placeholder={`Ask about ${pattern}… (Shift+Enter for new line)`}
              rows={2}
              className="flex-1 border border-rose-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-rose-600 resize-none"
            />
            <button
              onClick={sendChat}
              disabled={chatLoading || !chatInput.trim()}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-50 self-end"
              style={{ background: 'linear-gradient(135deg,#e11d48,#be123c)' }}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Pattern reference content ──────────────────────────────────────────────────
const PATTERN_INFO: Record<string, { strategy: string[]; pitfalls: string[]; templates: { name: string; code: string }[] }> = {
  'Binary Search': {
    strategy: [
      '━━ CORE IDEA ━━',
      'Binary search eliminates half the search space each step using a monotonic property. On N elements: ⌈log₂N⌉ comparisons → O(log N) time, O(1) space. It is one of the most misimplemented algorithms — always derive from a template.',
      'The search space does NOT need to be a physical array. It can be any range of integers or floats where you can evaluate a yes/no predicate in O(T) time → total O(T log N).',
      '━━ PRECONDITION: MONOTONICITY ━━',
      'Binary search requires a monotonic predicate P(x): some threshold k exists such that P(x) = false for all x < k and P(x) = true for all x ≥ k (or the mirror). If the array has duplicates or is not fully sorted, verify monotonicity still holds for your predicate.',
      'Reformulate every BS problem as: "find the boundary between [F F F T T T]". Binary search finds that exact boundary in O(log N). The answer is always the first T (lower bound) or last F (upper bound).',
      '━━ THE 3 TEMPLATES ━━',
      'Template 1 — EXACT MATCH: while (lo <= hi). Use when you know the target exists or need to explicitly return -1. mid = lo + (hi - lo) / 2. If match → return mid. Shrink toward target: lo = mid+1 or hi = mid-1.',
      'Template 2 — LOWER BOUND (first True): while (lo < hi), hi = mid when P(mid) true, lo = mid+1 when false. Returns lo = first index where P is true. Set hi = n (not n-1) to allow "not found" at index n.',
      'Template 3 — UPPER BOUND (last True): while (lo < hi), lo = mid+1 when P(mid) true, hi = mid when false. Returns lo-1 = last index where P is true. Must use mid = lo + (hi - lo + 1) / 2 (ceiling) to avoid infinite loop when hi = lo+1.',
      '━━ BINARY SEARCH ON ANSWER ━━',
      'When you cannot BS the input array itself, BS the answer space. Ask: "Is answer X feasible?" Write check(X) → bool. The feasible region is monotonic (if X works, X+1 also works). BS finds the minimum feasible X.',
      'Setting lo/hi for answer BS: lo = minimum possible answer (often max element or 1), hi = maximum possible answer (often sum of array or 10^9). Never set hi smaller than the true answer or you will miss it.',
      'Maximise variant: find the LARGEST X where check(X) = true. Flip the lower-bound template → upper-bound. lo = mid+1 when feasible, hi = mid when not.',
      'Signal words for BS on answer: "minimum speed / days / capacity / pages / force / distance", "given K operations find minimum", "at most K allowed", "feasible within constraint".',
      '━━ PROBLEM VARIANTS ━━',
      'Rotated sorted array: one half is always cleanly sorted. Compare arr[lo] with arr[mid] to identify the sorted half, then check if the target falls inside it.',
      '2-D matrix (row-sorted, row-start > prev-row-end): flatten to 1-D. row = mid / cols, col = mid % cols. O(log(m·n)).',
      'Peak element: any peak works → O(log N). If arr[mid] < arr[mid+1], peak is right of mid → lo = mid+1. Else peak is mid or left → hi = mid.',
      'Infinite / unbounded array: find upper bound first by doubling — lo = 1, hi = 1, while arr[hi] < target: hi *= 2. Then standard lower-bound between lo and hi.',
      'Floating-point answer (sqrt, nth-root): loop a fixed 100 iterations instead of lo < hi. Each iteration halves the error; after 100 steps error < 10⁻³⁰.',
      'First/last occurrence: lower-bound gives first index, upper-bound gives last. Count = upper - lower.',
      '━━ COMPLEXITY & CORRECTNESS ━━',
      'Time: O(log N) iterations × O(T) per predicate. Space: O(1) iterative, O(log N) recursive (stack). Always prefer iterative to avoid stack overflow on large N.',
      'Proof of termination: every iteration either lo increases or hi decreases, so hi - lo strictly shrinks. The loop exits in at most ⌈log₂(hi - lo + 1)⌉ steps.',
    ],
    pitfalls: [
      'INTEGER OVERFLOW: mid = (lo + hi) / 2 overflows when lo + hi > Integer.MAX_VALUE. Always use mid = lo + (hi - lo) / 2.',
      'INFINITE LOOP — wrong update: Template 2 (lower bound): if you write lo = mid instead of lo = mid+1, lo never advances when hi = lo+1. Rule: the side that is "wrong" must move strictly past mid.',
      'INFINITE LOOP — ceiling mid: Template 3 (upper bound) with lo = mid+1 when true. When hi = lo+1, floor mid = lo, so hi = mid = lo → hi never changes. Fix: use ceiling mid = lo + (hi - lo + 1) / 2.',
      'WRONG TEMPLATE MIX: while (lo <= hi) with lo = mid (not mid+1), or while (lo < hi) with return -1. Pick one template and use ALL its rules — boundary init, mid formula, update rule, return value.',
      'HI INITIALISED TOO SMALL for answer BS: if hi < true answer, the search space never contains it. Think carefully: "what is the maximum possible answer?" and set hi there.',
      'LO INITIALISED TOO LARGE: similarly, if lo > true answer, it is excluded from the start. For minimum-value problems lo is often max(arr) or 1, not 0.',
      'NOT VALIDATING MONOTONICITY: applying BS on non-monotonic data gives random results. Ask: "if X is feasible, is X+1 also feasible?" If no, BS does not apply.',
      'RETURNING LO VS LO-1: lower-bound returns lo (first True). Upper-bound returns lo-1 (last True). Getting this wrong gives off-by-one answers.',
      'PREDICATE BUG IN ANSWER BS: the check() function must be correct and consistent. A bug where check(true answer) returns false causes BS to overshoot.',
      'EDGE CASES: empty array (lo > hi immediately → return -1), all elements equal (BS still works, returns first/last), single element (one comparison).',
    ],
    templates: [
      {
        name: 'Template 1 — Exact Match',
        code: `int lo = 0, hi = n - 1;
while (lo <= hi) {
    int mid = lo + (hi - lo) / 2;   // floor, no overflow
    if (arr[mid] == target) return mid;
    else if (arr[mid] < target) lo = mid + 1;
    else                        hi = mid - 1;
}
return -1; // target not found`,
      },
      {
        name: 'Template 2 — Lower Bound (first index where arr[i] >= target)',
        code: `int lo = 0, hi = n;              // hi = n: "not present" sentinel
while (lo < hi) {
    int mid = lo + (hi - lo) / 2;  // floor mid
    if (arr[mid] < target) lo = mid + 1;  // mid is too small, discard
    else                   hi = mid;      // mid could be answer, keep
}
// lo == hi == first index where arr[i] >= target
// lo == n means target is larger than all elements
return lo;`,
      },
      {
        name: 'Template 3 — Upper Bound (last index where arr[i] <= target)',
        code: `int lo = 0, hi = n;                      // hi = n: sentinel
while (lo < hi) {
    int mid = lo + (hi - lo + 1) / 2;   // CEILING mid — prevents infinite loop
    if (arr[mid] <= target) lo = mid;    // mid qualifies, keep (lo = mid not mid+1)
    else                    hi = mid - 1;
}
// lo == last index where arr[i] <= target; lo == 0 and arr[0] > target means none
return lo;`,
      },
      {
        name: 'Binary Search on Answer — Minimise',
        code: `// Pattern: find minimum X such that check(X) is true
// check() must be monotonic: once true, stays true for all larger X

boolean check(int[] arr, int k, int mid) {
    int parts = 1, cur = 0;
    for (int x : arr) {
        if (cur + x > mid) { parts++; cur = 0; }
        cur += x;
    }
    return parts <= k;   // feasible with at most k splits
}

int lo = max(arr);     // minimum possible answer
int hi = sum(arr);     // maximum possible answer
while (lo < hi) {
    int mid = lo + (hi - lo) / 2;
    if (check(arr, k, mid)) hi = mid;   // feasible → try smaller
    else                    lo = mid + 1; // not feasible → must go bigger
}
return lo; // smallest feasible answer`,
      },
      {
        name: 'Binary Search on Answer — Maximise',
        code: `// Pattern: find maximum X such that check(X) is true
// check() must be: true for small X, false for large X

boolean check(int mid) { /* return whether mid is still feasible */ }

int lo = 1, hi = MAX_ANSWER;
while (lo < hi) {
    int mid = lo + (hi - lo + 1) / 2;  // ceiling mid
    if (check(mid)) lo = mid;           // feasible → try larger
    else            hi = mid - 1;       // too big → shrink
}
return lo; // largest feasible answer`,
      },
      {
        name: 'Search in Rotated Sorted Array',
        code: `// One half is always sorted — identify which, then check target
int lo = 0, hi = n - 1;
while (lo <= hi) {
    int mid = lo + (hi - lo) / 2;
    if (arr[mid] == target) return mid;

    if (arr[lo] <= arr[mid]) {               // LEFT half is sorted
        if (arr[lo] <= target && target < arr[mid])
            hi = mid - 1;                    // target in left half
        else lo = mid + 1;
    } else {                                 // RIGHT half is sorted
        if (arr[mid] < target && target <= arr[hi])
            lo = mid + 1;                    // target in right half
        else hi = mid - 1;
    }
}
return -1;`,
      },
      {
        name: 'Peak Element (O log N)',
        code: `// Any peak works. arr[-1] = arr[n] = -∞ (conceptually)
int lo = 0, hi = n - 1;
while (lo < hi) {
    int mid = lo + (hi - lo) / 2;
    if (arr[mid] < arr[mid + 1]) lo = mid + 1; // slope going up → peak is right
    else                         hi = mid;      // slope going down → peak is mid or left
}
return lo; // lo == hi == a peak index`,
      },
      {
        name: 'Floating-Point Binary Search (sqrt)',
        code: `// Fixed iterations instead of lo < hi to handle real-number precision
double lo = 0, hi = x;
for (int i = 0; i < 100; i++) {  // 100 iters → error < 10^-30
    double mid = (lo + hi) / 2;
    if (mid * mid <= x) lo = mid;
    else                hi = mid;
}
return lo; // sqrt(x) to arbitrary precision`,
      },
    ],
  },
  Array: {
    strategy: [
      'Identify if sorting the array unlocks an O(n log n) solution.',
      'Two-pointer: scan from both ends toward the center for sorted arrays.',
      'Sliding window: for subarray / substring problems with a condition on the window.',
      'Prefix-sum: precompute cumulative sums for O(1) range queries.',
      'HashMap to remember what you have seen and jump to the answer in O(1).',
    ],
    pitfalls: [
      'Off-by-one errors on left/right pointers — be precise about inclusive vs exclusive.',
      'Forgetting to handle empty arrays or single-element edge cases.',
      'Mutating the input array when it should stay unchanged.',
      'Not shrinking the sliding window correctly when the condition is violated.',
    ],
    templates: [
      {
        name: 'Two Pointers',
        code: `int l = 0, r = n - 1;
while (l < r) {
    if (condition) { /* use arr[l] and arr[r] */
    } else if (...) l++;
    else r--;
}`,
      },
      {
        name: 'Sliding Window (variable)',
        code: `int l = 0, best = 0;
Map<Character, Integer> freq = new HashMap<>();
for (int r = 0; r < n; r++) {
    freq.merge(s.charAt(r), 1, Integer::sum);
    while (/* invalid */) {
        freq.merge(s.charAt(l++), -1, Integer::sum);
    }
    best = Math.max(best, r - l + 1);
}`,
      },
    ],
  },
  DP: {
    strategy: [
      'Ask: "What am I optimising?" — min/max, count, or bool reachability.',
      'Define state clearly — what params uniquely identify a subproblem.',
      'Write the recurrence: dp[i] = f(dp[i-1], ...) before coding.',
      'Decide top-down (memo) or bottom-up (table). Bottom-up usually cleaner.',
      '1-D DP → often reducible to O(1) extra space by keeping only 2 rows.',
    ],
    pitfalls: [
      'Wrong base cases — draw a small example by hand first.',
      'Forgetting to initialise the dp array to ±∞ or 0 as needed.',
      'Loop order matters for bottom-up — ensure dependencies are ready.',
      'Conflating "number of ways" (addition) with "optimal" (min/max).',
    ],
    templates: [
      {
        name: '0-1 Knapsack',
        code: `int[] dp = new int[W + 1];
for (int i = 0; i < n; i++)
    for (int w = W; w >= wt[i]; w--)
        dp[w] = Math.max(dp[w], dp[w - wt[i]] + val[i]);`,
      },
      {
        name: 'LCS (2-D)',
        code: `int[][] dp = new int[m+1][n+1];
for (int i = 1; i <= m; i++)
  for (int j = 1; j <= n; j++)
    dp[i][j] = (a[i-1]==b[j-1])
        ? dp[i-1][j-1]+1
        : Math.max(dp[i-1][j], dp[i][j-1]);`,
      },
    ],
  },
  Graphs: {
    strategy: [
      'BFS for shortest path in unweighted graphs; level-order traversal.',
      'DFS for cycle detection, topological sort, connected components, path existence.',
      "Dijkstra for shortest path in weighted (non-negative) graphs — use a min-heap.",
      'Union-Find for dynamic connectivity, MST (Kruskal).',
      'Topological sort (Kahn\'s) for dependency/ordering problems (DAGs).',
    ],
    pitfalls: [
      'Forgetting to mark nodes visited before adding to the queue (causes duplicates).',
      'Not handling disconnected graphs — iterate over all nodes as potential DFS roots.',
      'Using Dijkstra on graphs with negative weights — use Bellman-Ford instead.',
      'Stack overflow on DFS for large graphs — convert to iterative if needed.',
    ],
    templates: [
      {
        name: 'BFS',
        code: `Queue<Integer> q = new LinkedList<>();
boolean[] vis = new boolean[n];
q.offer(src); vis[src] = true;
while (!q.isEmpty()) {
    int u = q.poll();
    for (int v : adj.get(u))
        if (!vis[v]) { vis[v] = true; q.offer(v); }
}`,
      },
      {
        name: 'Dijkstra',
        code: `int[] dist = new int[n]; Arrays.fill(dist, INF);
PriorityQueue<int[]> pq = new PriorityQueue<>(Comparator.comparingInt(a->a[0]));
dist[src] = 0; pq.offer(new int[]{0, src});
while (!pq.isEmpty()) {
    int[] cur = pq.poll();
    int d = cur[0], u = cur[1];
    if (d > dist[u]) continue;
    for (int[] e : adj.get(u))
        if (dist[u] + e[1] < dist[e[0]]) {
            dist[e[0]] = dist[u] + e[1];
            pq.offer(new int[]{dist[e[0]], e[0]});
        }
}`,
      },
    ],
  },
  Greedy: {
    strategy: [
      'Prove the greedy choice property: choosing the locally optimal option never hurts the global optimum.',
      'Prove the optimal substructure: the problem can be broken into subproblems.',
      'Common greedy choices: sort by end time (interval scheduling), sort by weight/value ratio (knapsack).',
      'When greedy fails, DP is likely needed.',
    ],
    pitfalls: [
      'Jumping to greedy without proving correctness — a counterexample is often easy to find.',
      'Not sorting in the right order before applying the greedy rule.',
      'Assuming greedy works for all variants of a problem (e.g., 0-1 knapsack ≠ fractional knapsack).',
    ],
    templates: [
      {
        name: 'Interval Scheduling (max non-overlapping)',
        code: `Arrays.sort(intervals, Comparator.comparingInt(a -> a[1]));
int count = 0, end = Integer.MIN_VALUE;
for (int[] iv : intervals)
    if (iv[0] >= end) { count++; end = iv[1]; }`,
      },
    ],
  },
  Heap: {
    strategy: [
      'Use a min-heap to repeatedly extract the smallest element in O(log n).',
      'Use a max-heap (negate values in Java) for the largest element.',
      'Two-heap pattern: a max-heap for the lower half and a min-heap for the upper half (median stream).',
      'Top-K problems: maintain a heap of size K — O(n log K) instead of O(n log n).',
    ],
    pitfalls: [
      'Java\'s PriorityQueue is a min-heap by default; negate values for max-heap behavior.',
      'Forgetting that heapify of an array is O(n) but N insertions is O(n log n).',
      'Not handling the case when K > n.',
    ],
    templates: [
      {
        name: 'Top-K Smallest',
        code: `PriorityQueue<Integer> maxH = new PriorityQueue<>(Collections.reverseOrder());
for (int x : nums) {
    maxH.offer(x);
    if (maxH.size() > k) maxH.poll();
}
// maxH contains K smallest; maxH.peek() = K-th smallest`,
      },
      {
        name: 'Median Stream (two heaps)',
        code: `PriorityQueue<Integer> lo = new PriorityQueue<>(Collections.reverseOrder()); // max-heap
PriorityQueue<Integer> hi = new PriorityQueue<>(); // min-heap
void add(int n) {
    lo.offer(n);
    hi.offer(lo.poll());
    if (lo.size() < hi.size()) lo.offer(hi.poll());
}
double median() {
    return lo.size() > hi.size() ? lo.peek() : (lo.peek() + hi.peek()) / 2.0;
}`,
      },
    ],
  },
  Stack: {
    strategy: [
      'Monotonic stack: maintain an increasing or decreasing stack to find next/prev greater/smaller elements in O(n).',
      'Stack for balanced parentheses: push open brackets, pop and match on close.',
      'Evaluate expressions: two stacks (operands + operators) or shunting-yard.',
      'Simulate recursion iteratively using an explicit stack.',
    ],
    pitfalls: [
      'Not checking if the stack is empty before peeking or popping.',
      'Off-by-one when computing widths in histogram/rainwater problems.',
      'Forgetting to flush remaining elements after the loop (common in monotonic stack).',
    ],
    templates: [
      {
        name: 'Next Greater Element',
        code: `int[] nge = new int[n]; Arrays.fill(nge, -1);
Deque<Integer> st = new ArrayDeque<>(); // stores indices
for (int i = 0; i < n; i++) {
    while (!st.isEmpty() && arr[st.peek()] < arr[i])
        nge[st.pop()] = arr[i];
    st.push(i);
}`,
      },
      {
        name: 'Largest Rectangle in Histogram',
        code: `Deque<Integer> st = new ArrayDeque<>();
int max = 0;
for (int i = 0; i <= n; i++) {
    int h = (i == n) ? 0 : heights[i];
    while (!st.isEmpty() && heights[st.peek()] > h) {
        int height = heights[st.pop()];
        int width = st.isEmpty() ? i : i - st.peek() - 1;
        max = Math.max(max, height * width);
    }
    st.push(i);
}`,
      },
    ],
  },
  String: {
    strategy: [
      'Two-pointer / sliding window: substrings with constraints.',
      'HashMap for character frequency: anagram / permutation checks.',
      'KMP or Z-algorithm for pattern matching in O(n+m).',
      'Trie for prefix searches and autocomplete.',
      'Rolling hash (Rabin-Karp) for multiple pattern matching.',
    ],
    pitfalls: [
      'Python strings are immutable — collect chars in a list and join.',
      'Java strings: use StringBuilder for repeated concatenation.',
      'charAt() vs codePointAt() — matters for Unicode / emoji.',
      'Not distinguishing between ASCII-only and Unicode inputs.',
    ],
    templates: [
      {
        name: 'Sliding Window — Longest Substring Without Repeat',
        code: `int[] idx = new int[128]; Arrays.fill(idx, -1);
int l = 0, best = 0;
for (int r = 0; r < s.length(); r++) {
    l = Math.max(l, idx[s.charAt(r)] + 1);
    idx[s.charAt(r)] = r;
    best = Math.max(best, r - l + 1);
}`,
      },
      {
        name: 'KMP — Pattern Search',
        code: `int[] fail = new int[m]; // failure function
for (int i = 1, j = 0; i < m; i++) {
    while (j > 0 && pat[i] != pat[j]) j = fail[j-1];
    if (pat[i] == pat[j]) j++;
    fail[i] = j;
}
for (int i = 0, j = 0; i < n; i++) {
    while (j > 0 && txt[i] != pat[j]) j = fail[j-1];
    if (txt[i] == pat[j]) j++;
    if (j == m) { /* match at i-m+1 */ j = fail[j-1]; }
}`,
      },
    ],
  },
}
