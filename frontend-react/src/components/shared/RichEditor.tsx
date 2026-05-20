import { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'

interface Props {
  content: string
  onChange?: (html: string) => void
  placeholder?: string
  editable?: boolean
}

export default function RichEditor({ content, onChange, placeholder, editable = true }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: { languageClassPrefix: 'language-' } }),
      Underline,
      Placeholder.configure({ placeholder: placeholder ?? 'Start writing…' }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
  })

  // Sync content when it changes externally (e.g. server data arrives)
  useEffect(() => {
    if (!editor) return
    if (content !== editor.getHTML()) {
      editor.commands.setContent(content || '', { emitUpdate: false })
    }
  }, [content, editor])

  // Sync editable mode
  useEffect(() => {
    editor?.setEditable(editable)
  }, [editable, editor])

  const btn = (active: boolean, onClick: () => void, title: string, children: React.ReactNode) => (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
        active
          ? 'bg-rose-600 text-white'
          : 'text-gray-600 hover:bg-rose-100 hover:text-rose-700'
      }`}
    >
      {children}
    </button>
  )

  return (
    <div className={`rounded-xl border overflow-hidden ${editable ? 'border-rose-300' : 'border-transparent'}`}>
      {/* Toolbar — only shown in edit mode */}
      {editable && editor && (
        <div className="flex flex-wrap gap-0.5 px-2 py-1.5 bg-rose-50 border-b border-rose-200">
          {btn(editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), 'Bold', <strong>B</strong>)}
          {btn(editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(), 'Italic', <em>I</em>)}
          {btn(editor.isActive('underline'), () => editor.chain().focus().toggleUnderline().run(), 'Underline', <u>U</u>)}
          {btn(editor.isActive('strike'), () => editor.chain().focus().toggleStrike().run(), 'Strikethrough', <s>S</s>)}

          <span className="w-px bg-rose-200 mx-0.5 self-stretch" />

          {btn(editor.isActive('heading', { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), 'Heading 2', 'H2')}
          {btn(editor.isActive('heading', { level: 3 }), () => editor.chain().focus().toggleHeading({ level: 3 }).run(), 'Heading 3', 'H3')}

          <span className="w-px bg-rose-200 mx-0.5 self-stretch" />

          {btn(editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run(), 'Bullet list', '• List')}
          {btn(editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run(), 'Numbered list', '1. List')}
          {btn(editor.isActive('blockquote'), () => editor.chain().focus().toggleBlockquote().run(), 'Blockquote', '❝')}

          <span className="w-px bg-rose-200 mx-0.5 self-stretch" />

          {btn(editor.isActive('code'), () => editor.chain().focus().toggleCode().run(), 'Inline code', '`code`')}
          {btn(editor.isActive('codeBlock'), () => editor.chain().focus().toggleCodeBlock().run(), 'Code block', '</>')}

          <span className="w-px bg-rose-200 mx-0.5 self-stretch" />

          {btn(false, () => editor.chain().focus().undo().run(), 'Undo', '↩')}
          {btn(false, () => editor.chain().focus().redo().run(), 'Redo', '↪')}
        </div>
      )}

      {/* Editor body */}
      <EditorContent
        editor={editor}
        className={`rich-editor ${editable ? 'min-h-[140px]' : ''}`}
      />
    </div>
  )
}
