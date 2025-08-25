## Forms and Validation

This document covers form-specific patterns, validation strategies, and components in the mentorship system. For broader architecture, see `design.md`, for data fetching see `query.md`, and for authentication patterns see `authentication.md`.

### Form Stack

**Core Libraries:**

- **React Hook Form v7.53.2**: Form state management and validation
- **@hookform/resolvers v3.9.1**: Zod integration resolver
- **Zod**: Schema validation with TypeScript inference

**UI Layer:**

- **Custom Form Wrapper**: `src/common/components/ui/form.tsx` - React Hook Form + Radix UI integration
- **Specialized Components**: Rich text editor, file uploads, OTP inputs

### Form Architecture

#### Component System

```ts
// Core form wrapper integrating React Hook Form with Radix UI
const Form = FormProvider; // React Hook Form context

const FormField = <TFieldValues, TName>({ ...props }: ControllerProps) => (
  <FormFieldContext.Provider value={{ name: props.name }}>
    <Controller {...props} />
  </FormFieldContext.Provider>
);

// Automatic error handling and accessibility
const useFormField = () => {
  // Returns: error, formItemId, formDescriptionId, formMessageId
};
```

**Component Hierarchy:**

- `Form` → `FormField` → `FormItem` → `FormLabel` + `FormControl` + `FormMessage`
- Automatic ARIA attributes and error state management
- Consistent styling via TailwindCSS design tokens

#### Validation Strategy

**Schema-First with Zod:**

```ts
// Reusable validation building blocks
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(
    /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])/,
    "Complex password required"
  );

// Composed schemas with cross-field validation
export const signUpSchema = basicUserSchema
  .extend({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
```

### Form Patterns

#### 1. Simple Forms (Authentication)

**Pattern**: Direct register with schema validation

```ts
export function SignInForm({ onSuccess }) {
  const { signInWithEmail, error } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
  });

  return (
    <form
      onSubmit={handleSubmit(async (data) => {
        await signInWithEmail(data);
        onSuccess();
      })}
    >
      <Input
        type="email"
        placeholder="Enter your email"
        {...register("email")}
      />
      <ErrorMessage message={errors.email?.message} />

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Signing in..." : "Sign In"}
      </Button>
    </form>
  );
}
```

#### 2. Complex Forms with Controller Pattern

**Pattern**: FormField wrapper for complex components

```ts
<FormField
  control={form.control}
  name="difficulty"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Difficulty</FormLabel>
      <Select onValueChange={field.onChange} defaultValue={field.value}>
        <FormControl>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectItem value="BEGINNER">Beginner</SelectItem>
          <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
          <SelectItem value="ADVANCED">Advanced</SelectItem>
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>
```

#### 3. Dynamic Array Fields

**Pattern**: Add/remove functionality with validation

```ts
function AddListField({ form, fieldName, label, placeholder }) {
  const [newValue, setNewValue] = useState("");

  const addItem = () => {
    if (newValue.trim()) {
      const currentItems = form.watch(fieldName) || [];
      form.setValue(fieldName, [...currentItems, newValue.trim()]);
      setNewValue("");
    }
  };

  const removeItem = (index: number) => {
    const currentItems = form.watch(fieldName) || [];
    form.setValue(
      fieldName,
      currentItems.filter((_, i) => i !== index)
    );
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyDown={(e) =>
            e.key === "Enter" && (e.preventDefault(), addItem())
          }
        />
        <Button type="button" onClick={addItem} variant="outline" size="icon">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-1">
        {form.watch(fieldName)?.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between rounded-md bg-secondary p-2"
          >
            <span className="text-sm">{item}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeItem(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Specialized Components

#### Rich Text Editor

**TipTap Integration** (`src/common/components/RichText.tsx`):

```ts
export default function RichText() {
  const { setValue, watch } = useFormContext();
  const content = watch("description") || "";

  const editor = useEditor({
    extensions: [StarterKit, Image],
    content,
    onUpdate({ editor }) {
      setValue("description", editor.getHTML(), { shouldDirty: true });
    },
    editorProps: {
      handlePaste(_, event) {
        // Handle image paste from clipboard
      },
      handleDrop(_, event) {
        // Handle image drag & drop
      },
    },
  });

  const handleImageUpload = async (file: File) => {
    const [res] = await uploadFiles("imageUploader", { files: [file] });
    if (res) editor?.chain().focus().setImage({ src: res.url }).run();
  };

  return <EditorContent editor={editor} />;
}
```

**Features:**

- Automatic form integration via `useFormContext`
- Image upload with drag & drop support
- UploadThing integration for secure file handling

#### File Upload Components

**Image Upload with Preview**:

```ts
export function ProjectImages({ form }) {
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newImages = files.map((file) => ({
        url: URL.createObjectURL(file),
        alt: file.name,
      }));
      setValue("images", [...(watch("images") || []), ...newImages]);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
      {watch("images")?.map((image, index) => (
        <div key={image.url} className="relative aspect-square">
          <Image src={image.url} alt={`Project image ${index + 1}`} fill />
          <Button onClick={() => removeImage(index)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleImageUpload}
      />
    </div>
  );
}
```

#### Password Input with Toggle

```ts
const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ showPasswordToggle = false, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="relative">
        <input type={showPassword ? "text" : "password"} ref={ref} {...props} />
        {showPasswordToggle && (
          <Button type="button" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <EyeOff /> : <Eye />}
          </Button>
        )}
      </div>
    );
  }
);
```

### Validation Schemas

#### Common Patterns

**File**: `src/features/schemas/auth.schema.ts`

```ts
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100, "Password must be at most 100 characters")
  .regex(
    /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])/,
    "Password must contain uppercase, lowercase, number and special character"
  );

export const signUpSchema = basicUserSchema
  .extend({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
```

**File**: `src/features/templates/schemas/template.schema.ts`

```ts
export const createProjectTemplateSchema = baseTemplateSchema
  .refine(
    (data) => {
      if (
        data.accessType === "CREDITS" &&
        (!data.credits || data.credits <= 0)
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Credits are required for credit-based projects",
      path: ["credits"],
    }
  )
  .refine((data) => data.minParticipants <= data.maxParticipants, {
    message: "Min participants cannot exceed max participants",
    path: ["maxParticipants"],
  });
```

### Error Handling

#### Client-Side Error Display

**ErrorMessage Component** (`src/common/components/ErrorMessage.tsx`):

```ts
export function ErrorMessage({ message, className }) {
  const [animateRef] = useAnimate<HTMLDivElement>();

  return (
    <div ref={animateRef}>
      {message && (
        <p className={cn("text-red-500 text-sm", className)}>{message}</p>
      )}
    </div>
  );
}
```

#### Server Integration

**tRPC Error Formatting** (already covered in `query.md`):

- Zod validation errors automatically mapped to form fields
- Type-safe error handling with field-specific messages
- Integration with React Hook Form's `setError` for server validation

### Best Practices

#### Form State Management

```ts
// ✅ Use controller pattern for complex components
<FormField control={form.control} name="field" render={({ field }) => ...} />

// ✅ Use register for simple inputs
<Input {...register("email")} />

// ✅ Reset forms properly for edit modes
useEffect(() => {
  if (isDialogOpen && existingData) {
    form.reset(transformedData);
  }
}, [isDialogOpen, existingData, form]);
```

#### Schema Design

```ts
// ✅ Build reusable validation schemas
const baseSchema = z.object({
  /* common fields */
});
const createSchema = baseSchema.omit({ id: true });
const updateSchema = baseSchema.partial().required({ id: true });

// ✅ Use custom refinements for business logic
const schema = baseSchema.superRefine((data, ctx) => {
  if (data.condition && !data.requiredField) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Field required when condition is met",
      path: ["requiredField"],
    });
  }
});
```

#### Performance Optimization

```ts
// ✅ Isolate form components to prevent unnecessary re-renders
const EmailField = React.memo(({ form }) => (
  <FormField control={form.control} name="email" render={...} />
));

// ✅ Use debounced validation for expensive operations
const debouncedValidation = useMemo(
  () => debounce(async (value) => { /* validation */ }, 300),
  []
);
```

### Related Files

**Core Infrastructure:**

- `src/common/components/ui/form.tsx` - Form component system
- `src/common/components/ErrorMessage.tsx` - Error display with animations

**Schemas:**

- `src/features/schemas/auth.schema.ts` - Authentication validation
- `src/features/workspace/schemas/task.schema.ts` - Task management
- `src/features/templates/schemas/template.schema.ts` - Template creation

**Specialized Components:**

- `src/common/components/RichText.tsx` - TipTap rich text editor
- `src/common/components/ui/input.tsx` - Input variants including password
- `src/common/components/ui/GenericCombobox.tsx` - Multi-select combobox

**Form Implementations:**

- `src/features/auth/components/Signin/SignInForm.tsx` - Simple form pattern
- `src/features/task/components/TaskDialog.tsx` - Complex form with rich editor
- `src/features/templates/components/CreateProjectTemplateDialog.tsx` - Multi-step wizard
