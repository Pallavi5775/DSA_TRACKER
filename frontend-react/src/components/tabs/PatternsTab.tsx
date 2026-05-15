import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPatternNotes, updatePatternNote, patternChat } from '../../api/client'
import { PatternNote } from '../../types'

const PATTERNS = [
  { id: 'Array', label: '🔢 Array' },
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
                : 'bg-white border border-rose-200 text-rose-500 hover:bg-rose-50'
            }`}
            style={activePattern === p.id ? { background: 'linear-gradient(135deg,#c97b6e,#b5615a)' } : undefined}
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
  const [chatHistory, setChatHistory] = useState<ChatMsg[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)

  // Reset when pattern or note data changes
  // (note: initial state from useState args handles first render;
  //  key prop on PatternView in parent forces remount on pattern change)

  const save = useMutation({
    mutationFn: () => updatePatternNote(pattern, notes, memo),
    onSuccess: () => { setDirty(false); onSaved() },
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
            <div className="bg-white border border-rose-200 rounded-2xl p-5 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-widest text-rose-500 mb-3">
                🧭 Core Strategy
              </h3>
              <ul className="space-y-1.5">
                {info.strategy.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-rose-400 mt-0.5 flex-shrink-0">▸</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white border border-rose-200 rounded-2xl p-5 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-widest text-rose-500 mb-3">
                ⚠ Common Pitfalls
              </h3>
              <ul className="space-y-1.5">
                {info.pitfalls.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-rose-400 mt-0.5 flex-shrink-0">•</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            {info.templates && info.templates.length > 0 && (
              <div className="bg-white border border-rose-200 rounded-2xl p-5 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-widest text-rose-500 mb-3">
                  💻 Templates
                </h3>
                {info.templates.map((t, i) => (
                  <div key={i} className="mb-3">
                    <p className="text-xs font-semibold text-rose-400 mb-1">{t.name}</p>
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
        <div className="bg-white border border-rose-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-widest text-rose-500 mb-3">
            📝 My Notes
          </h3>
          <textarea
            value={notes}
            onChange={(e) => { setNotes(e.target.value); setDirty(true) }}
            rows={5}
            placeholder={`Your personal notes on ${pattern} pattern…`}
            className="w-full border border-rose-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-rose-500 resize-y"
          />
        </div>

        <div className="bg-white border border-rose-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-widest text-rose-500 mb-3">
            🧠 Memory Techniques
          </h3>
          <textarea
            value={memo}
            onChange={(e) => { setMemo(e.target.value); setDirty(true) }}
            rows={3}
            placeholder="Mnemonics, stories, or memory tricks…"
            className="w-full border border-rose-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-rose-500 resize-y"
          />
        </div>

        {dirty && (
          <button
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="w-full py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg,#c97b6e,#b5615a)' }}
          >
            {save.isPending ? 'Saving…' : '💾 Save Notes'}
          </button>
        )}

        {/* AI chat */}
        <div className="bg-white border border-rose-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-widest text-rose-500 mb-3">
            💬 AI Pattern Coach
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
            {chatHistory.map((m, i) => (
              <div
                key={i}
                className={`text-xs rounded-lg px-3 py-2 leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-rose-50 text-rose-900 ml-8'
                    : 'bg-gray-50 text-gray-700 mr-8 border-l-2 border-rose-400'
                }`}
              >
                {m.content}
              </div>
            ))}
            {chatLoading && <p className="text-xs text-gray-400 italic px-3">Thinking…</p>}
          </div>
          <div className="flex gap-2">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendChat()}
              placeholder={`Ask about ${pattern}…`}
              className="flex-1 border border-rose-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-rose-500"
            />
            <button
              onClick={sendChat}
              disabled={chatLoading || !chatInput.trim()}
              className="px-3 py-2 rounded-lg text-xs font-bold text-white disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#c97b6e,#b5615a)' }}
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
