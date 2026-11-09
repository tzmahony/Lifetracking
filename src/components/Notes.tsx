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
    const note: Note = { id: generateId(), title: 'Untitled', content: '', tags: [], updatedAt: new Date().toISOString(), createdAt: new Date().toISOString(), pinned: false };
    setNotes(prev => [note, ...prev]);
    setSelected(note);
  };

  const updateNote = (id: string, patch: Partial<Note>) => {
    const updated = { ...patch, updatedAt: new Date().toISOString() };
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updated } : n));
    setSelected(prev => prev?.id === id ? { ...prev, ...updated } : prev);
  };
  const removeNote = (id: string) => { setNotes(prev => prev.filter(n => n.id !== id)); if (selected?.id === id) setSelected(null); };

  const allTags = [...new Set(notes.flatMap(n => n.tags))];
  const filtered = notes
    .filter(n => { const q = search.toLowerCase(); return (!q || n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)) && (!activeTag || n.tags.includes(activeTag)); })
    .sort((a, b) => { if (a.pinned !== b.pinned) return a.pinned ? -1 : 1; return b.updatedAt.localeCompare(a.updatedAt); });

  return (
    <div style={{ display: 'flex', gap: '0', height: 'calc(100vh - 100px)', minHeight: '500px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
      {/* Left panel — note list */}
      <div style={{ width: '220px', flexShrink: 0, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--bg-layer1)' }}>
        {/* Search + new */}
        <div style={{ padding: '10px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '6px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={12} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" style={{ width: '100%', paddingLeft: '26px', paddingRight: '8px', paddingTop: '5px', paddingBottom: '5px', background: 'var(--bg-layer2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <button onClick={addNote} style={{ padding: '5px 8px', background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <Plus size={14} />
          </button>
        </div>

        {/* Tags */}
        {allTags.length > 0 && (
          <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {allTags.map(tag => (
              <button key={tag} onClick={() => setActiveTag(activeTag === tag ? null : tag)} style={{
                fontSize: '10px', padding: '2px 7px', borderRadius: '99px', cursor: 'pointer',
                border: '1px solid var(--border)', background: activeTag === tag ? 'var(--accent)' : 'transparent',
                color: activeTag === tag ? '#fff' : 'var(--text-tertiary)', fontWeight: 600,
              }}>#{tag}</button>
            ))}
          </div>
        )}

        {/* Note list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filtered.length === 0 && (
            <div style={{ padding: '24px', textAlign: 'center', fontSize: '12px', color: 'var(--text-disabled)' }}>No notes yet</div>
          )}
          {filtered.map((note, i) => (
            <button key={note.id} onClick={() => setSelected(note)} style={{
              width: '100%', textAlign: 'left', padding: '10px 12px',
              borderBottom: i < filtered.length - 1 ? '1px solid var(--border-subtle)' : 'none',
              background: selected?.id === note.id ? 'var(--accent-subtle)' : 'transparent',
              borderLeft: selected?.id === note.id ? '2px solid var(--accent)' : '2px solid transparent',
              cursor: 'pointer', display: 'block',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' }}>
                {note.pinned && <Pin size={9} style={{ color: 'var(--warning)', flexShrink: 0 }} />}
                <span style={{ fontSize: '12px', fontWeight: 600, color: selected?.id === note.id ? 'var(--accent)' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {note.title || 'Untitled'}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{note.content}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-disabled)', marginTop: '4px' }}>{format(new Date(note.updatedAt), 'MMM d')}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Right panel — editor */}
      {selected ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-layer1)', overflow: 'hidden' }}>
          {/* Title bar */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input value={selected.title} onChange={e => updateNote(selected.id, { title: e.target.value })}
              style={{ flex: 1, background: 'transparent', border: 'none', fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', outline: 'none' }} placeholder="Title…" />
            <button onClick={() => updateNote(selected.id, { pinned: !selected.pinned })} style={{ padding: '4px', background: 'transparent', border: 'none', cursor: 'pointer', color: selected.pinned ? 'var(--warning)' : 'var(--text-disabled)' }}>
              <Pin size={14} />
            </button>
            <button onClick={() => removeNote(selected.id)} style={{ padding: '4px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-disabled)' }}>
              <X size={14} />
            </button>
          </div>
          {/* Tags bar */}
          <div style={{ padding: '7px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Tag size={11} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
            <input value={selected.tags.join(', ')} onChange={e => updateNote(selected.id, { tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
              placeholder="Add tags (comma separated)…" style={{ background: 'transparent', border: 'none', fontSize: '12px', color: 'var(--text-secondary)', outline: 'none', flex: 1 }} />
          </div>
          {/* Body */}
          <textarea value={selected.content} onChange={e => updateNote(selected.id, { content: e.target.value })}
            placeholder="Start writing…" style={{ flex: 1, background: 'transparent', border: 'none', padding: '16px', color: 'var(--text-primary)', fontSize: '13px', lineHeight: '1.7', outline: 'none', resize: 'none', fontFamily: 'inherit' }} />
          {/* Footer */}
          <div style={{ padding: '7px 16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-disabled)' }}>
            <span>Last edited {format(new Date(selected.updatedAt), 'MMM d, yyyy HH:mm')}</span>
            <span>{selected.content.split(/\s+/).filter(Boolean).length} words</span>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-layer1)' }}>
          <div style={{ textAlign: 'center', color: 'var(--text-disabled)' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📝</div>
            <div style={{ fontSize: '13px' }}>Select a note or create one</div>
          </div>
        </div>
      )}
    </div>
  );
}
