"use client";
import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import {
  FaBold,
  FaItalic,
  FaStrikethrough,
  FaCode,
  FaListUl,
  FaListOl,
  FaQuoteRight,
  FaUndo,
  FaRedo,
  FaMinus,
  FaAlignLeft,
  FaAlignCenter,
  FaAlignRight,
  FaAlignJustify,
} from 'react-icons/fa';
import { RiImageAddFill } from 'react-icons/ri';
import { MdFormatClear } from 'react-icons/md';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) return null;

  const buttonClass = (isActive: boolean) =>
    `p-2 rounded transition-colors ${
      isActive ? 'bg-gray-300 text-gray-900' : 'text-gray-700 hover:bg-gray-200'
    }`;

  // Get current block type (paragraph or heading)
  const getCurrentBlockType = () => {
    if (editor.isActive('heading', { level: 1 })) return 'h1';
    if (editor.isActive('heading', { level: 2 })) return 'h2';
    if (editor.isActive('heading', { level: 3 })) return 'h3';
    if (editor.isActive('heading', { level: 4 })) return 'h4';
    if (editor.isActive('heading', { level: 5 })) return 'h5';
    if (editor.isActive('heading', { level: 6 })) return 'h6';
    return 'paragraph';
  };

  const handleBlockChange = (value: string) => {
    if (value === 'paragraph') {
      editor.chain().focus().setParagraph().run();
    } else {
      const level = parseInt(value.replace('h', ''), 10);
      editor.chain().focus().toggleHeading({ level }).run();
    }
  };

  return (
    <div className="bg-gray-100 p-2 flex flex-wrap gap-1 border-b sticky top-0 z-10">
      {/* Dropdown for Paragraph / Headings */}
      <select
        value={getCurrentBlockType()}
        onChange={(e) => handleBlockChange(e.target.value)}
        className="px-2 py-1 border rounded bg-white text-sm cursor-pointer"
      >
        <option value="paragraph">Paragraph</option>
        <option value="h1">Heading 1</option>
        <option value="h2">Heading 2</option>
        <option value="h3">Heading 3</option>
        <option value="h4">Heading 4</option>
        <option value="h5">Heading 5</option>
        <option value="h6">Heading 6</option>
      </select>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Text formatting */}
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={buttonClass(editor.isActive('bold'))}>
        <FaBold />
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={buttonClass(editor.isActive('italic'))}>
        <FaItalic />
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={buttonClass(editor.isActive('strike'))}>
        <FaStrikethrough />
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleCode().run()} className={buttonClass(editor.isActive('code'))}>
        <FaCode />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Text alignment */}
      <button type="button" onClick={() => editor.chain().focus().setTextAlign('left').run()} className={buttonClass(editor.isActive({ textAlign: 'left' }))}>
        <FaAlignLeft />
      </button>
      <button type="button" onClick={() => editor.chain().focus().setTextAlign('center').run()} className={buttonClass(editor.isActive({ textAlign: 'center' }))}>
        <FaAlignCenter />
      </button>
      <button type="button" onClick={() => editor.chain().focus().setTextAlign('right').run()} className={buttonClass(editor.isActive({ textAlign: 'right' }))}>
        <FaAlignRight />
      </button>
      <button type="button" onClick={() => editor.chain().focus().setTextAlign('justify').run()} className={buttonClass(editor.isActive({ textAlign: 'justify' }))}>
        <FaAlignJustify />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Lists & Blockquote */}
      <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={buttonClass(editor.isActive('bulletList'))}>
        <FaListUl />
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={buttonClass(editor.isActive('orderedList'))}>
        <FaListOl />
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={buttonClass(editor.isActive('blockquote'))}>
        <FaQuoteRight />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Code block & Horizontal rule */}
      <button type="button" onClick={() => editor.chain().focus().toggleLi().run()} className={buttonClass(editor.isActive('codeBlock'))}>
        <FaCode />
      </button>
      <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()} className={buttonClass(false)}>
        <FaMinus />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Image */}
      <button type="button"
        onClick={() => {
          const url = window.prompt('Enter image URL');
          if (url) editor.chain().focus().setImage({ src: url }).run();
        }}
        className="p-2 rounded text-gray-700 hover:bg-gray-200"
      >
        <RiImageAddFill />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Clear formatting & Undo/Redo */}
      <button type="button" onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} className={buttonClass(false)}>
        <MdFormatClear />
      </button>
      <button type="button" onClick={() => editor.chain().focus().undo().run()} className={buttonClass(false)}>
        <FaUndo />
      </button>
      <button type="button" onClick={() => editor.chain().focus().redo().run()} className={buttonClass(false)}>
        <FaRedo />
      </button>
    </div>
  );
};

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Placeholder.configure({
        placeholder: 'Write your blog content here...',
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return <div className="text-center p-4">Loading editor...</div>;

  return (
    <div className="border rounded-lg overflow-hidden  bg-white">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} className="prose prose-lg max-w-none p-4 min-h-[300px]" />
    </div>
  );
};

export default RichTextEditor;