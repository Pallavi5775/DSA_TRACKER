import { useEffect, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import { marked } from 'marked'

interface Props {
  content: string
  onChange?: (html: string) => void
  placeholder?: string
  editable?: boolean
}

// Detect whether a string is already HTML or plain/markdown text
const isHTML = (s: string) => /<(p|h[1-6]|ul|ol|li|strong|em|pre|code|blockquote)\b/i.test(s)

// Convert plain text / markdown → HTML for TipTap
async function toHTML(raw: string): Promise<string> {
  if (!raw || !raw.trim()) return ''
  if (isHTML(raw)) return raw
  return String(await marked.parse(raw, { async: true, gfm: true, breaks: true }))
}

export default function RichEditor({ content, onChange, placeholder, editable = true }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: { languageClassPrefix: 'language-' } }),
      Underline,
      Placeholder.configure({ placeholder: placeholder ?? 'Start writing…' }),
    ],
    content: '',
    editable,
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
  })

  // Load content — auto-convert markdown/plain text to HTML
  useEffect(() => {
    if (!editor) return
    toHTML(content).then((html) => {
      if (html !== editor.getHTML()) {
        editor.commands.setContent(html, { emitUpdate: false })
      }
    })
  }, [content, editor])

  // Sync editable mode
  useEffect(() => {
    editor?.setEditable(editable)
  }, [editable, editor])

  // Format button: take current plain text, re-parse as markdown, reload
  const autoFormat = useCallback(async () => {
    if (!editor) return
    const raw = editor.getText({ blockSeparator: '\n' })
    const html = String(await marked.parse(raw, { async: true, gfm: true, breaks: true }))
    editor.commands.setContent(html, { emitUpdate: true })
    onChange?.(editor.getHTML())
  }, [editor, onChange])

  const btn = (active: boolean, onClick: () => void, title: string, children: React.ReactNode) => (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      className={`px-2 py-1 rounded text-xs font-semibold transition-colors select-none ${
        active
          ? 'bg-rose-600 text-white'
          : 'text-gray-600 hover:bg-rose-100 hover:text-rose-700'
      }`}
    >
      {children}
    </button>
  )

  const sep = () => <span className="w-px bg-rose-200 mx-0.5 self-stretch" />

  return (
    <div className={`rounded-xl border overflow-hidden ${editable ? 'border-rose-300' : 'border-transparent'}`}>
      {editable && editor && (
        <div className="flex flex-wrap gap-0.5 px-2 py-1.5 bg-rose-50 border-b border-rose-200">
          {/* Text formatting */}
          {btn(editor.isActive('bold'),      () => editor.chain().focus().toggleBold().run(),      'Bold',          <strong>B</strong>)}
          {btn(editor.isActive('italic'),    () => editor.chain().focus().toggleItalic().run(),    'Italic',        <em>I</em>)}
          {btn(editor.isActive('underline'), () => editor.chain().focus().toggleUnderline().run(), 'Underline',     <u>U</u>)}
          {btn(editor.isActive('strike'),    () => editor.chain().focus().toggleStrike().run(),    'Strikethrough', <s>S</s>)}
          {sep()}
          {/* Headings */}
          {btn(editor.isActive('heading', { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), 'Heading 2', 'H2')}
          {btn(editor.isActive('heading', { level: 3 }), () => editor.chain().focus().toggleHeading({ level: 3 }).run(), 'Heading 3', 'H3')}
          {sep()}
          {/* Lists & quote */}
          {btn(editor.isActive('bulletList'),  () => editor.chain().focus().toggleBulletList().run(),  'Bullet list',   '• List')}
          {btn(editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run(), 'Numbered list', '1. List')}
          {btn(editor.isActive('blockquote'),  () => editor.chain().focus().toggleBlockquote().run(),  'Blockquote',    '❝')}
          {sep()}
          {/* Code */}
          {btn(editor.isActive('code'),      () => editor.chain().focus().toggleCode().run(),      'Inline code', '`code`')}
          {btn(editor.isActive('codeBlock'), () => editor.chain().focus().toggleCodeBlock().run(), 'Code block',  '</>')}
          {sep()}
          {/* History */}
          {btn(false, () => editor.chain().focus().undo().run(), 'Undo', '↩')}
          {btn(false, () => editor.chain().focus().redo().run(), 'Redo', '↪')}
          {sep()}
          {/* Auto-format */}
          <button
            type="button"
            title="Auto-format: converts plain text / markdown to rich formatting"
            onMouseDown={(e) => { e.preventDefault(); autoFormat() }}
            className="px-2 py-1 rounded text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 transition-colors select-none"
          >
            ✨ Format
          </button>
        </div>
      )}

      <EditorContent
        editor={editor}
        className={`rich-editor ${editable ? 'min-h-[140px]' : ''}`}
      />
    </div>
  )
}
