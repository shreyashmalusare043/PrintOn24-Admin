import React, { useRef, useState, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Link,
  Heading1,
  Heading2,
  Heading3,
  Type,
  Eye,
  Edit,
  Quote,
  Undo,
  Redo,
  Image as ImageIcon,
  RemoveFormatting
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Write content here...',
  minHeight = '350px'
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  // Exception 3: Only 'edit' and 'preview' modes. HTML tab removed entirely.
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [fontFamily, setFontFamily] = useState('sans-serif');
  const [fontSize, setFontSize] = useState('3'); // HTML font size 1-7 (3 = ~16px)

  // Sync incoming value to contentEditable on initial or external change when not focused
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      if (document.activeElement !== editorRef.current) {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [value]);

  const executeCommand = (command: string, arg: string | undefined = undefined) => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(command, false, arg);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInsertLink = () => {
    const url = prompt('Enter URL address (e.g. https://printon24.com/help):');
    if (url) {
      executeCommand('createLink', url);
    }
  };

  const handleInsertImage = () => {
    const url = prompt('Enter Image URL (e.g. https://images.unsplash.com/...):');
    if (url) {
      executeCommand('insertImage', url);
    }
  };

  const handleHeadingChange = (heading: string) => {
    executeCommand('formatBlock', heading);
  };

  const handleFontFamilyChange = (font: string) => {
    setFontFamily(font);
    executeCommand('fontName', font);
  };

  const handleFontSizeChange = (size: string) => {
    setFontSize(size);
    executeCommand('fontSize', size);
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card flex flex-col shadow-sm">
      {/* Editor Header Toolbar */}
      <div className="border-b border-border bg-muted/40 p-2 flex flex-wrap items-center justify-between gap-1.5">
        <div className="flex flex-wrap items-center gap-1">
          {/* Headings */}
          <Select onValueChange={handleHeadingChange} defaultValue="p">
            <SelectTrigger className="h-8 text-xs w-28 bg-background">
              <SelectValue placeholder="Style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="p">Paragraph</SelectItem>
              <SelectItem value="h1">Heading 1</SelectItem>
              <SelectItem value="h2">Heading 2</SelectItem>
              <SelectItem value="h3">Heading 3</SelectItem>
              <SelectItem value="blockquote">Quote Block</SelectItem>
              <SelectItem value="pre">Code Block</SelectItem>
            </SelectContent>
          </Select>

          {/* Font Family */}
          <Select onValueChange={handleFontFamilyChange} value={fontFamily}>
            <SelectTrigger className="h-8 text-xs w-28 bg-background">
              <SelectValue placeholder="Font" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Inter, sans-serif">Inter Sans</SelectItem>
              <SelectItem value="Arial, sans-serif">Arial</SelectItem>
              <SelectItem value="Georgia, serif">Georgia Serif</SelectItem>
              <SelectItem value="'Courier New', monospace">Monospace</SelectItem>
            </SelectContent>
          </Select>

          {/* Font Size */}
          <Select onValueChange={handleFontSizeChange} value={fontSize}>
            <SelectTrigger className="h-8 text-xs w-20 bg-background">
              <SelectValue placeholder="Size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Small</SelectItem>
              <SelectItem value="3">Regular</SelectItem>
              <SelectItem value="4">Medium</SelectItem>
              <SelectItem value="5">Large</SelectItem>
              <SelectItem value="6">X-Large</SelectItem>
            </SelectContent>
          </Select>

          <div className="h-5 w-px bg-border mx-1" />

          {/* Formatting Controls */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => executeCommand('bold')}
            className="h-8 w-8 hover:bg-muted"
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-3.5 h-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => executeCommand('italic')}
            className="h-8 w-8 hover:bg-muted"
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-3.5 h-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => executeCommand('underline')}
            className="h-8 w-8 hover:bg-muted"
            title="Underline (Ctrl+U)"
          >
            <Underline className="w-3.5 h-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => executeCommand('strikeThrough')}
            className="h-8 w-8 hover:bg-muted"
            title="Strikethrough"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </Button>

          <div className="h-5 w-px bg-border mx-1" />

          {/* Alignment */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => executeCommand('justifyLeft')}
            className="h-8 w-8 hover:bg-muted"
            title="Align Left"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => executeCommand('justifyCenter')}
            className="h-8 w-8 hover:bg-muted"
            title="Align Center"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => executeCommand('justifyRight')}
            className="h-8 w-8 hover:bg-muted"
            title="Align Right"
          >
            <AlignRight className="w-3.5 h-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => executeCommand('justifyFull')}
            className="h-8 w-8 hover:bg-muted"
            title="Justify Text"
          >
            <AlignJustify className="w-3.5 h-3.5" />
          </Button>

          <div className="h-5 w-px bg-border mx-1" />

          {/* Lists, Links, Image, Clear */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => executeCommand('insertUnorderedList')}
            className="h-8 w-8 hover:bg-muted"
            title="Bulleted List"
          >
            <List className="w-3.5 h-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => executeCommand('insertOrderedList')}
            className="h-8 w-8 hover:bg-muted"
            title="Numbered List"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleInsertLink}
            className="h-8 w-8 hover:bg-muted"
            title="Insert Hyperlink"
          >
            <Link className="w-3.5 h-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleInsertImage}
            className="h-8 w-8 hover:bg-muted"
            title="Insert Image"
          >
            <ImageIcon className="w-3.5 h-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => executeCommand('removeFormat')}
            className="h-8 w-8 hover:bg-muted"
            title="Clear Formatting"
          >
            <RemoveFormatting className="w-3.5 h-3.5" />
          </Button>

          <div className="h-5 w-px bg-border mx-1" />

          {/* Undo / Redo */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => executeCommand('undo')}
            className="h-8 w-8 hover:bg-muted"
            title="Undo"
          >
            <Undo className="w-3.5 h-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => executeCommand('redo')}
            className="h-8 w-8 hover:bg-muted"
            title="Redo"
          >
            <Redo className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* View mode toggle - ONLY Edit and Preview (Exception 3: HTML tab removed) */}
        <div className="flex items-center space-x-1">
          <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)}>
            <TabsList className="h-8 text-[11px]">
              <TabsTrigger value="edit" className="h-7 text-xs px-2.5 flex items-center gap-1">
                <Edit className="w-3 h-3" /> Edit
              </TabsTrigger>
              <TabsTrigger value="preview" className="h-7 text-xs px-2.5 flex items-center gap-1">
                <Eye className="w-3 h-3" /> Preview
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Editor Body */}
      <div className="relative flex-1 bg-background">
        {activeTab === 'edit' && (
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onBlur={handleInput}
            style={{ minHeight }}
            className="p-4 outline-none prose prose-sm dark:prose-invert max-w-none focus:ring-0 text-foreground"
            dangerouslySetInnerHTML={{ __html: value || '' }}
          />
        )}

        {activeTab === 'preview' && (
          <div
            style={{ minHeight }}
            className="p-4 bg-muted/20 border-border prose prose-sm dark:prose-invert max-w-none overflow-y-auto"
            dangerouslySetInnerHTML={{ __html: value || '<p className="text-muted-foreground italic">No content to preview</p>' }}
          />
        )}
      </div>
    </div>
  );
};
