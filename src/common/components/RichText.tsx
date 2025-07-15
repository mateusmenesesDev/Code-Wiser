import Image from '@tiptap/extension-image';
import { type Editor, EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useFormContext } from 'react-hook-form';
import { uploadFiles } from '../utils/uploadthing';

export default function RichText() {
	const { setValue, watch } = useFormContext();
	const content = watch('description') || '';

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

	return (
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
	);
}
