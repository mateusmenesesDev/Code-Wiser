import Image from '@tiptap/extension-image';
import { type Editor, EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
	Bold,
	Code,
	Italic,
	List,
	ListOrdered,
	Redo,
	Strikethrough,
	Type,
	Undo
} from 'lucide-react';
import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { cn } from '~/lib/utils';
import { uploadFiles } from '../utils/uploadthing';
import { Button } from './ui/button';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from './ui/select';
import { Separator } from './ui/separator';

export default function RichText() {
	const { setValue, watch } = useFormContext();
	const content = watch('description') || '';

	const handleImageUpload = async (
		file: File,
		editorInstance: Editor | null
	) => {
		if (!editorInstance) return;

		try {
			const [res] = await uploadFiles('imageUploader', {
				files: [file]
			});
			if (!res) return;

			editorInstance.chain().focus().setImage({ src: res.url }).run();
		} catch (error) {
			console.error('Image upload failed:', error);
		}
	};

	const editor = useEditor({
		immediatelyRender: false,
		extensions: [StarterKit, Image],
		content,
		onUpdate({ editor }) {
			setValue('description', editor.getHTML(), { shouldDirty: true });
		},
		editorProps: {
			attributes: {
				spellcheck: 'true',
				class:
					'min-h-[150px] max-h-[300px] overflow-y-auto p-2 rounded-md border border-input bg-background text-sm'
			},
			handlePaste(_, event) {
				const items = event.clipboardData?.items;
				if (!items) return false;

				for (const item of items) {
					if (item.type.indexOf('image') === 0) {
						const file = item.getAsFile();
						if (file) {
							void handleImageUpload(file, editor);
							event.preventDefault();
							return true;
						}
					}
				}
				return false;
			},
			handleDrop(_, event) {
				const files = event.dataTransfer?.files;
				if (!files || files.length === 0) return false;

				const file = files[0];
				if (file?.type?.startsWith('image/')) {
					void handleImageUpload(file, editor);
					event.preventDefault();
					return true;
				}
				return false;
			}
		}
	});

	// Update editor content when form value changes
	useEffect(() => {
		if (editor && content !== editor.getHTML()) {
			editor.commands.setContent(content || '');
		}
	}, [content, editor]);

	if (!editor) {
		return null;
	}

	return (
		<div className="space-y-2">
			{/* Toolbar */}
			<div className="flex flex-wrap items-center gap-1 rounded-md border border-input bg-muted/50 p-1">
				{/* Text Formatting */}
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className={cn('h-8 w-8', editor.isActive('bold') && 'bg-accent')}
					onClick={() => editor.chain().focus().toggleBold().run()}
					disabled={!editor.can().chain().focus().toggleBold().run()}
					title="Bold (Ctrl+B)"
				>
					<Bold className="h-4 w-4" />
				</Button>
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className={cn('h-8 w-8', editor.isActive('italic') && 'bg-accent')}
					onClick={() => editor.chain().focus().toggleItalic().run()}
					disabled={!editor.can().chain().focus().toggleItalic().run()}
					title="Italic (Ctrl+I)"
				>
					<Italic className="h-4 w-4" />
				</Button>
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className={cn('h-8 w-8', editor.isActive('strike') && 'bg-accent')}
					onClick={() => editor.chain().focus().toggleStrike().run()}
					disabled={!editor.can().chain().focus().toggleStrike().run()}
					title="Strikethrough"
				>
					<Strikethrough className="h-4 w-4" />
				</Button>
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className={cn('h-8 w-8', editor.isActive('code') && 'bg-accent')}
					onClick={() => editor.chain().focus().toggleCode().run()}
					disabled={!editor.can().chain().focus().toggleCode().run()}
					title="Inline Code"
				>
					<Code className="h-4 w-4" />
				</Button>

				<Separator orientation="vertical" className="h-6" />

				{/* Font Size */}
				<Select
					value={
						editor.isActive('heading', { level: 1 })
							? 'h1'
							: editor.isActive('heading', { level: 2 })
								? 'h2'
								: editor.isActive('heading', { level: 3 })
									? 'h3'
									: 'normal'
					}
					onValueChange={(value) => {
						if (value === 'normal') {
							editor.chain().focus().setParagraph().run();
						} else if (value === 'h1') {
							editor.chain().focus().toggleHeading({ level: 1 }).run();
						} else if (value === 'h2') {
							editor.chain().focus().toggleHeading({ level: 2 }).run();
						} else if (value === 'h3') {
							editor.chain().focus().toggleHeading({ level: 3 }).run();
						}
					}}
				>
					<SelectTrigger className="h-8 w-[110px]">
						<Type className="mr-2 h-4 w-4" />
						<SelectValue placeholder="Size" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="normal">Normal</SelectItem>
						<SelectItem value="h1">Large (H1)</SelectItem>
						<SelectItem value="h2">Medium (H2)</SelectItem>
						<SelectItem value="h3">Small (H3)</SelectItem>
					</SelectContent>
				</Select>

				<Separator orientation="vertical" className="h-6" />

				{/* Lists */}
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className={cn(
						'h-8 w-8',
						editor.isActive('bulletList') && 'bg-accent'
					)}
					onClick={() => editor.chain().focus().toggleBulletList().run()}
					title="Bullet List"
				>
					<List className="h-4 w-4" />
				</Button>
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className={cn(
						'h-8 w-8',
						editor.isActive('orderedList') && 'bg-accent'
					)}
					onClick={() => editor.chain().focus().toggleOrderedList().run()}
					title="Numbered List"
				>
					<ListOrdered className="h-4 w-4" />
				</Button>

				<Separator orientation="vertical" className="h-6" />

				{/* Undo/Redo */}
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className="h-8 w-8"
					onClick={() => editor.chain().focus().undo().run()}
					disabled={!editor.can().chain().focus().undo().run()}
					title="Undo (Ctrl+Z)"
				>
					<Undo className="h-4 w-4" />
				</Button>
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className="h-8 w-8"
					onClick={() => editor.chain().focus().redo().run()}
					disabled={!editor.can().chain().focus().redo().run()}
					title="Redo (Ctrl+Y)"
				>
					<Redo className="h-4 w-4" />
				</Button>
			</div>

			{/* Editor */}
			<div
				onDrop={(e) => {
					e.preventDefault();
					const file = e.dataTransfer?.files?.[0];
					if (file?.type.startsWith('image/')) {
						void handleImageUpload(file, editor);
					}
				}}
				onDragOver={(e) => e.preventDefault()}
			>
				<EditorContent editor={editor} />
			</div>
		</div>
	);
}
