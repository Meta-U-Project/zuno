import { useState, useEffect, useRef, forwardRef } from 'react';
import Sidebar from '../../components/dashboard_components/Sidebar';
import WelcomeHeader from '../../components/dashboard_components/WelcomeHeader';
import './NotesPage.css';

const SimpleRichTextEditor = forwardRef(({ value, onChange }, ref) => {
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  return (
    <div className="simple-editor-container">
      <div className="editor-toolbar">
        <button onClick={() => document.execCommand('bold')} type="button">Bold</button>
        <button onClick={() => document.execCommand('italic')} type="button">Italic</button>
        <button onClick={() => document.execCommand('underline')} type="button">Underline</button>
        <button onClick={() => document.execCommand('insertOrderedList')} type="button">Numbered List</button>
        <button onClick={() => document.execCommand('insertUnorderedList')} type="button">Bullet List</button>
      </div>
      <div
        ref={(node) => {
          editorRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        className="simple-editor"
        contentEditable
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        suppressContentEditableWarning={true}
        style={{
          minHeight: '300px',
          border: '1px solid #e2e8f0',
          borderRadius: '4px',
          padding: '12px',
          outline: 'none',
          overflowY: 'auto',
          direction: 'ltr',
          textAlign: 'left'
        }}
      />
    </div>
  );
});

SimpleRichTextEditor.displayName = 'SimpleRichTextEditor';

const NotesPage = () => {
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent'); // 'recent' or 'alphabetical'
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courses, setCourses] = useState([]);
  const [lastSaved, setLastSaved] = useState(null);
  const [allTags, setAllTags] = useState([]);
  const titleUpdateTimeout = useRef(null);
  const contentUpdateTimeout = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const notesResponse = await fetch(`${import.meta.env.VITE_SERVER_URL}/notes`, {
          credentials: 'include',
        });

        if (notesResponse.ok) {
          const notesData = await notesResponse.json();
          setNotes(notesData);

          if (notesData.length > 0) {
            setSelectedNote(notesData[0]);
          }
        } else {
          console.error('Failed to fetch notes');
        }

        const coursesResponse = await fetch(`${import.meta.env.VITE_SERVER_URL}/canvas/courses`, {
          credentials: 'include',
        });

        if (coursesResponse.ok) {
          const coursesData = await coursesResponse.json();
          const formattedCourses = coursesData.map(course => ({
            id: course.id,
            name: course.course_name
          }));
          setCourses(formattedCourses);
        } else {
          console.error('Failed to fetch courses');
        }

        const tagsResponse = await fetch(`${import.meta.env.VITE_SERVER_URL}/notes/tags/all`, {
          credentials: 'include',
        });

        if (tagsResponse.ok) {
          const tagsData = await tagsResponse.json();
          setAllTags(tagsData);
        } else {
          console.error('Failed to fetch tags');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTags = selectedTags.length === 0 ||
                       selectedTags.every(tag => note.tags.includes(tag));

    const matchesCourse = !selectedCourse || note.courseId === selectedCourse;

    return matchesSearch && matchesTags && matchesCourse;
  });

  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (sortBy === 'recent') {
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    } else {
      return a.title.localeCompare(b.title);
    }
  });

  const groupedNotes = sortedNotes.reduce((groups, note) => {
    const today = new Date();
    const noteDate = new Date(note.updatedAt);

    if (noteDate.toDateString() === today.toDateString()) {
      if (!groups.today) groups.today = [];
      groups.today.push(note);
    }
    else if (noteDate > new Date(today.setDate(today.getDate() - 7))) {
      if (!groups.thisWeek) groups.thisWeek = [];
      groups.thisWeek.push(note);
    }
    else {
      if (!groups.older) groups.older = [];
      groups.older.push(note);
    }

    return groups;
  }, {});

  const handleNoteSelect = (note) => {
    setSelectedNote(note);
  };

  const handleCreateNewNote = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: "Untitled Note",
          content: "",
          tags: []
        })
      });

      if (response.ok) {
        const newNote = await response.json();
        setNotes([newNote, ...notes]);
        setSelectedNote(newNote);
        setLastSaved(new Date());
      } else {
        console.error('Failed to create note');
      }
    } catch (error) {
      console.error('Error creating note:', error);
    }
  };

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    const updatedNote = { ...selectedNote, title: newTitle, updatedAt: new Date() };
    setSelectedNote(updatedNote);

    const updatedNotes = notes.map(note =>
      note.id === selectedNote.id ? updatedNote : note
    );
    setNotes(updatedNotes);

    if (titleUpdateTimeout.current) {
      clearTimeout(titleUpdateTimeout.current);
    }

    titleUpdateTimeout.current = setTimeout(() => {
      updateNoteInDatabase(selectedNote.id, { title: newTitle });
    }, 1000);
  };

  const handleContentChange = (content) => {
    const updatedNote = { ...selectedNote, content, updatedAt: new Date() };
    setSelectedNote(updatedNote);

    const updatedNotes = notes.map(note =>
      note.id === selectedNote.id ? updatedNote : note
    );
    setNotes(updatedNotes);

    if (contentUpdateTimeout.current) {
      clearTimeout(contentUpdateTimeout.current);
    }

    contentUpdateTimeout.current = setTimeout(() => {
      updateNoteInDatabase(selectedNote.id, { content });
    }, 1000);
  };

  const handleCourseChange = (e) => {
    const courseId = e.target.value;
    const course = courses.find(c => c.id === courseId);

    const updatedNote = {
      ...selectedNote,
      courseId: courseId === "none" ? null : courseId,
      courseName: courseId === "none" ? null : course.name,
      updatedAt: new Date()
    };

    setSelectedNote(updatedNote);

    const updatedNotes = notes.map(note =>
      note.id === selectedNote.id ? updatedNote : note
    );
    setNotes(updatedNotes);

    updateNoteInDatabase(selectedNote.id, {
      courseId: courseId === "none" ? null : courseId
    });
  };

  const handleTagInput = (e) => {
    if (e.key === 'Enter' && e.target.value.trim() !== '') {
      const newTag = e.target.value.trim().toLowerCase();

      if (!selectedNote.tags.includes(newTag)) {
        const updatedTags = [...selectedNote.tags, newTag];
        const updatedNote = { ...selectedNote, tags: updatedTags, updatedAt: new Date() };
        setSelectedNote(updatedNote);

        const updatedNotes = notes.map(note =>
          note.id === selectedNote.id ? updatedNote : note
        );
        setNotes(updatedNotes);

        if (!allTags.includes(newTag)) {
          setAllTags([...allTags, newTag]);
        }

        updateNoteInDatabase(selectedNote.id, { tags: updatedTags });
      }

      e.target.value = '';
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    const updatedTags = selectedNote.tags.filter(tag => tag !== tagToRemove);
    const updatedNote = { ...selectedNote, tags: updatedTags, updatedAt: new Date() };
    setSelectedNote(updatedNote);

    const updatedNotes = notes.map(note =>
      note.id === selectedNote.id ? updatedNote : note
    );
    setNotes(updatedNotes);

    updateNoteInDatabase(selectedNote.id, { tags: updatedTags });
  };

  const updateNoteInDatabase = async (noteId, updatedFields) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/notes/${noteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updatedFields)
      });

      if (response.ok) {
        setLastSaved(new Date());
      } else {
        console.error('Failed to update note');
      }
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  const handleTagFilter = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return diffInMinutes < 1 ? 'Just now' : `${diffInMinutes}m ago`;
    }
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays}d ago`;

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks === 1) return '1w ago';
    return `${diffInWeeks}w ago`;
  };

  const getPreview = (content) => {
    const plainText = content.replace(/<[^>]+>/g, '');
    return plainText.length > 60 ? plainText.substring(0, 60) + '...' : plainText;
  };

  const handleSettings = () => {
    console.log('Settings clicked - Coming soon!');
  };

  return (
    <div className="dashboard-container">
      <Sidebar />

      <div className="dashboard-main">
        <WelcomeHeader
          title="Notes"
          subtitle="Create and organize your study notes."
          onSettingsClick={handleSettings}
        />

        <div className="notes-content">

        {/* Left Panel (Sidebar) */}
        <div className="notes-sidebar">
          <div className="notes-sidebar-header">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>

            <button className="create-note-btn" onClick={handleCreateNewNote}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              New Note
            </button>
          </div>

          <div className="filter-options">
            <div className="filter-section">
              <div className="filter-header">
                <span>Tags</span>
              </div>
              <div className="tags-list">
                {allTags.map(tag => (
                  <span
                    key={tag}
                    className={`tag-filter ${selectedTags.includes(tag) ? 'selected' : ''}`}
                    onClick={() => handleTagFilter(tag)}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="filter-section">
              <div className="filter-header">
                <span>Course</span>
              </div>
              <select
                className="course-filter"
                value={selectedCourse || ""}
                onChange={(e) => setSelectedCourse(e.target.value || null)}
              >
                <option value="">All Courses</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>{course.name}</option>
                ))}
              </select>
            </div>

            <div className="filter-section">
              <div className="filter-header">
                <span>Sort</span>
              </div>
              <div className="sort-options">
                <button
                  className={`sort-btn ${sortBy === 'recent' ? 'active' : ''}`}
                  onClick={() => setSortBy('recent')}
                >
                  Recent
                </button>
                <button
                  className={`sort-btn ${sortBy === 'alphabetical' ? 'active' : ''}`}
                  onClick={() => setSortBy('alphabetical')}
                >
                  A-Z
                </button>
              </div>
            </div>
          </div>

          <div className="notes-list">
            {/* Today's Notes */}
            {groupedNotes.today && groupedNotes.today.length > 0 && (
              <div className="notes-group">
                <h3 className="group-title">Today</h3>
                {groupedNotes.today.map(note => (
                  <div
                    key={note.id}
                    className={`note-item ${selectedNote && selectedNote.id === note.id ? 'selected' : ''}`}
                    onClick={() => handleNoteSelect(note)}
                  >
                    <div className="note-item-content">
                      <h4 className="note-title">{note.title}</h4>
                      <p className="note-preview">{getPreview(note.content)}</p>
                      <div className="note-meta">
                        <span className="note-time">{formatTimeAgo(note.updatedAt)}</span>
                        {note.courseName && (
                          <span className="note-course">{note.courseName}</span>
                        )}
                      </div>
                      {note.tags.length > 0 && (
                        <div className="note-tags">
                          {note.tags.slice(0, 2).map(tag => (
                            <span key={tag} className="note-tag">{tag}</span>
                          ))}
                          {note.tags.length > 2 && (
                            <span className="note-tag-more">+{note.tags.length - 2}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* This Week's Notes */}
            {groupedNotes.thisWeek && groupedNotes.thisWeek.length > 0 && (
              <div className="notes-group">
                <h3 className="group-title">This Week</h3>
                {groupedNotes.thisWeek.map(note => (
                  <div
                    key={note.id}
                    className={`note-item ${selectedNote && selectedNote.id === note.id ? 'selected' : ''}`}
                    onClick={() => handleNoteSelect(note)}
                  >
                    <div className="note-item-content">
                      <h4 className="note-title">{note.title}</h4>
                      <p className="note-preview">{getPreview(note.content)}</p>
                      <div className="note-meta">
                        <span className="note-time">{formatTimeAgo(note.updatedAt)}</span>
                        {note.courseName && (
                          <span className="note-course">{note.courseName}</span>
                        )}
                      </div>
                      {note.tags.length > 0 && (
                        <div className="note-tags">
                          {note.tags.slice(0, 2).map(tag => (
                            <span key={tag} className="note-tag">{tag}</span>
                          ))}
                          {note.tags.length > 2 && (
                            <span className="note-tag-more">+{note.tags.length - 2}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Older Notes */}
            {groupedNotes.older && groupedNotes.older.length > 0 && (
              <div className="notes-group">
                <h3 className="group-title">Older</h3>
                {groupedNotes.older.map(note => (
                  <div
                    key={note.id}
                    className={`note-item ${selectedNote && selectedNote.id === note.id ? 'selected' : ''}`}
                    onClick={() => handleNoteSelect(note)}
                  >
                    <div className="note-item-content">
                      <h4 className="note-title">{note.title}</h4>
                      <p className="note-preview">{getPreview(note.content)}</p>
                      <div className="note-meta">
                        <span className="note-time">{formatTimeAgo(note.updatedAt)}</span>
                        {note.courseName && (
                          <span className="note-course">{note.courseName}</span>
                        )}
                      </div>
                      {note.tags.length > 0 && (
                        <div className="note-tags">
                          {note.tags.slice(0, 2).map(tag => (
                            <span key={tag} className="note-tag">{tag}</span>
                          ))}
                          {note.tags.length > 2 && (
                            <span className="note-tag-more">+{note.tags.length - 2}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* No notes message */}
            {Object.keys(groupedNotes).length === 0 && (
              <div className="empty-notes">
                <p>No notes found</p>
                <button className="create-note-btn" onClick={handleCreateNewNote}>Create your first note</button>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel (Note Editor) */}
        <div className="note-editor">
          {selectedNote ? (
            <>
              <div className="editor-header">
                <input
                  type="text"
                  className="note-title-input"
                  value={selectedNote.title}
                  onChange={handleTitleChange}
                  placeholder="Note title"
                />

                <div className="editor-meta">
                  <div className="course-selector">
                    <select
                      value={selectedNote.courseId || "none"}
                      onChange={handleCourseChange}
                    >
                      <option value="none">No Course</option>
                      {courses.map(course => (
                        <option key={course.id} value={course.id}>{course.name}</option>
                      ))}
                    </select>
                  </div>

                  {lastSaved && (
                    <div className="save-status">
                      Saved {formatTimeAgo(lastSaved)}
                    </div>
                  )}
                </div>
              </div>

              <div className="editor-content">
                <SimpleRichTextEditor
                  value={selectedNote.content}
                  onChange={handleContentChange}
                />
              </div>

              <div className="editor-footer">
                <div className="tags-input-container">
                  <div className="tags-display">
                    {selectedNote.tags.map(tag => (
                      <span key={tag} className="editor-tag">
                        {tag}
                        <button
                          className="remove-tag-btn"
                          onClick={() => handleRemoveTag(tag)}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    className="tag-input"
                    placeholder="Add tag... (press Enter)"
                    onKeyDown={handleTagInput}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="no-note-selected">
              <div className="no-note-message">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="#cbd5e0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 2V8H20" stroke="#cbd5e0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 13H8" stroke="#cbd5e0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 17H8" stroke="#cbd5e0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 9H9H8" stroke="#cbd5e0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <h3>No Note Selected</h3>
                <p>Select a note from the sidebar or create a new one</p>
                <button className="create-note-btn" onClick={handleCreateNewNote}>Create New Note</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
};

export default NotesPage;
