import { useState } from 'react';
import { format } from 'date-fns';
import { Plus, X, Pin, Search, Tag } from 'lucide-react';
import type { Note } from '../types';
import { generateId } from '../store';

interface Props {
  notes: Note[];
  setNotes: (n: Note[] | ((prev: Note[]) => Note[])) => void;
}

export default function Notes({ notes, setNotes }: Props) {
  const [selected, setSelected] = useState<Note | null>(null);
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const addNote = () => {
    const note: Note = {
      id: generateId(),
      title: 'Untitled',
      content: '',
      tags: [],
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      pinned: false,
    };
    setNotes(prev => [note, ...prev]);
    setSelected(note);
  };

  const updateNote = (id: string, patch: Partial<Note>) => {
    const updated = { ...patch, updatedAt: new Date().toISOString() };
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updated } : n));
    setSelected(prev => prev?.id === id ? { ...prev, ...updated } : prev);
  };

  const removeNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const allTags = [...new Set(notes.flatMap(n => n.tags))];

  const filtered = notes
    .filter(n => {
      const q = search.toLowerCase();
      return (!q || n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q))
        && (!activeTag || n.tags.includes(activeTag));
    })
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.updatedAt.localeCompare(a.updatedAt);
    });

  return (
    <div className="flex gap-4 h-[calc(100vh-220px)] min-h-[400px]">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search..." className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm outline-none focus:border-indigo-500 transition-colors" />
          </div>
          <button onClick={addNote} className="p-2 bg-indigo-500 hover:bg-indigo-600 rounded-xl transition-colors">
            <Plus size={16} />
          </button>
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {allTags.map(tag => (
              <button key={tag} onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={`text-xs px-2 py-1 rounded-full transition-colors ${activeTag === tag ? 'bg-indigo-500' : 'bg-white/5 hover:bg-white/10'}`}>
                #{tag}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-1.5">
          {filtered.length === 0 && (
            <div className="text-center py-8 text-gray-500 text-sm">No notes yet</div>
          )}
          {filtered.map(note => (
            <button key={note.id} onClick={() => setSelected(note)}
              className={`w-full text-left p-3 rounded-xl transition-all group ${selected?.id === note.id ? 'bg-indigo-500/20 border border-indigo-500/30' : 'hover:bg-white/5 border border-transparent'}`}>
              <div className="flex items-center gap-1.5 mb-1">
                {note.pinned && <Pin size={10} className="text-amber-400 flex-shrink-0" />}
                <span className="text-sm font-medium truncate">{note.title || 'Untitled'}</span>
              </div>
              <p className="text-xs text-gray-500 line-clamp-2">{note.content}</p>
              <div className="text-xs text-gray-600 mt-1">{format(new Date(note.updatedAt), 'MMM d')}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Editor */}
      {selected ? (
        <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl flex flex-col overflow-hidden">
          <div className="flex items-center gap-3 p-4 border-b border-white/10">
            <input value={selected.title} onChange={e => updateNote(selected.id, { title: e.target.value })}
              className="flex-1 bg-transparent text-xl font-bold outline-none placeholder:text-gray-600"
              placeholder="Title..." />
            <button onClick={() => updateNote(selected.id, { pinned: !selected.pinned })}
              className={`p-2 rounded-xl transition-colors ${selected.pinned ? 'text-amber-400 bg-amber-400/10' : 'text-gray-500 hover:bg-white/10'}`}>
              <Pin size={16} />
            </button>
            <button onClick={() => removeNote(selected.id)}
              className="p-2 hover:bg-red-500/20 rounded-xl text-gray-500 hover:text-red-400 transition-colors">
              <X size={16} />
            </button>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5">
            <Tag size={12} className="text-gray-500" />
            <input
              value={selected.tags.join(', ')}
              onChange={e => updateNote(selected.id, { tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
              placeholder="Add tags (comma separated)..."
              className="bg-transparent text-xs text-gray-400 outline-none flex-1 placeholder:text-gray-600" />
          </div>
          <textarea
            value={selected.content}
            onChange={e => updateNote(selected.id, { content: e.target.value })}
            placeholder="Start writing..."
            className="flex-1 bg-transparent p-4 outline-none resize-none text-sm text-gray-200 leading-relaxed placeholder:text-gray-600"
          />
          <div className="px-4 py-2 text-xs text-gray-600 border-t border-white/5">
            Last edited {format(new Date(selected.updatedAt), 'MMM d, yyyy HH:mm')} · {selected.content.split(/\s+/).filter(Boolean).length} words
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-600">
          <div className="text-center">
            <div className="text-4xl mb-3">📝</div>
            <p>Select a note or create one</p>
          </div>
        </div>
      )}
    </div>
  );
}
