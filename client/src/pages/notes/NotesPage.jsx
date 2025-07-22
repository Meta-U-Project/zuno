import { useState, useEffect, useRef, forwardRef } from 'react';
import Sidebar from '../../components/dashboard_components/Sidebar';
import WelcomeHeader from '../../components/dashboard_components/WelcomeHeader';
import './NotesPage.css';

const SimpleRichTextEditor = forwardRef(({ value, onChange }, ref) => {
  const editorRef = useRef(null);
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    orderedList: false,
    unorderedList: false
  });

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const checkActiveFormats = () => {
    if (!document.queryCommandEnabled) return;

    setActiveFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      orderedList: document.queryCommandState('insertOrderedList'),
      unorderedList: document.queryCommandState('insertUnorderedList')
    });
  };

  const handleFormat = (command, e) => {
    e.preventDefault();
    document.execCommand(command);

    if (editorRef.current) {
      editorRef.current.focus();
    }

    checkActiveFormats();
  };

  return (
    <div className="simple-editor-container">
      <div
        className="simple-editor-wrapper"
      >
        <div className="editor-toolbar">
          <button
            onClick={(e) => handleFormat('bold', e)}
            type="button"
            className={activeFormats.bold ? 'active' : ''}
            title="Bold"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 12H14C16.2091 12 18 10.2091 18 8C18 5.79086 16.2091 4 14 4H6V12ZM6 12H15C17.2091 12 19 13.7909 19 16C19 18.2091 17.2091 20 15 20H6V12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            onClick={(e) => handleFormat('italic', e)}
            type="button"
            className={activeFormats.italic ? 'active' : ''}
            title="Italic"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 4H10M14 20H5M15 4L9 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            onClick={(e) => handleFormat('underline', e)}
            type="button"
            className={activeFormats.underline ? 'active' : ''}
            title="Underline"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 3V10C6 13.3137 8.68629 16 12 16C15.3137 16 18 13.3137 18 10V3M4 21H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            onClick={(e) => handleFormat('insertOrderedList', e)}
            type="button"
            className={activeFormats.orderedList ? 'active' : ''}
            title="Numbered List"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 6H21M10 12H21M10 18H21M4 6H4.01M4 12H4.01M4 18H4.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4 7L5 6V10" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4 16L6 18L4 20" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            onClick={(e) => handleFormat('insertUnorderedList', e)}
            type="button"
            className={activeFormats.unorderedList ? 'active' : ''}
            title="Bullet List"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 6H21M9 12H21M9 18H21M5 6C5 6.55228 4.55228 7 4 7C3.44772 7 3 6.55228 3 6C3 5.44772 3.44772 5 4 5C4.55228 5 5 5.44772 5 6ZM5 12C5 12.5523 4.55228 13 4 13C3.44772 13 3 12.5523 3 12C3 11.4477 3.44772 11 4 11C4.55228 11 5 11.4477 5 12ZM5 18C5 18.5523 4.55228 19 4 19C3.44772 19 3 18.5523 3 18C3 17.4477 3.44772 17 4 17C4.55228 17 5 17.4477 5 18Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
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
          onMouseUp={checkActiveFormats}
          onKeyUp={checkActiveFormats}
          onSelect={checkActiveFormats}
          suppressContentEditableWarning={true}
        />
      </div>
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
  const [showFilters, setShowFilters] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
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
    const tempElement = document.createElement('div');
    tempElement.innerHTML = content;
    const plainText = tempElement.textContent || tempElement.innerText || '';
    return plainText.length > 60 ? plainText.substring(0, 60) + '...' : plainText;
  };

  const handleSettings = () => {
    console.log('Settings clicked - Coming soon!');
  };

  const handleDeleteNote = async () => {
    if (!selectedNote) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/notes/${selectedNote.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        const updatedNotes = notes.filter(note => note.id !== selectedNote.id);
        setNotes(updatedNotes);

        if (updatedNotes.length > 0) {
          setSelectedNote(updatedNotes[0]);
        } else {
          setSelectedNote(null);
        }

        setShowDeleteConfirm(false);
      } else {
        console.error('Failed to delete note');
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    }
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
            <div className="notes-sidebar-actions">
              <div className="search-icon-container">
                <button
                  className="icon-btn search-icon"
                  onClick={() => document.getElementById('search-input').focus()}
                  title="Search notes"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <input
                  id="search-input"
                  type="text"
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>

              <div className="header-icons">
                <button
                  className="icon-btn filter-icon"
                  onClick={() => setShowFilters(!showFilters)}
                  title="Filter notes"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 3H2L10 12.46V19L14 21V12.46L22 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                <button
                  className="icon-btn create-note-icon"
                  onClick={handleCreateNewNote}
                  title="Create new note"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {showFilters && (
            <div className="filter-dropdown">
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
          )}

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
                        <span className="note-time">{formatTimeAgo(new Date(note.updatedAt))}</span>
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
                        <span className="note-time">{formatTimeAgo(new Date(note.updatedAt))}</span>
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
                        <span className="note-time">{formatTimeAgo(new Date(note.updatedAt))}</span>
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
        <div className={`note-editor ${isFullScreen ? 'fullscreen' : ''}`}>
          {selectedNote ? (
            <>
              <button
                className="fullscreen-toggle-btn"
                onClick={() => setIsFullScreen(!isFullScreen)}
                title={isFullScreen ? "Exit full screen" : "Full screen"}
              >
                {isFullScreen ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 3V5H4V9H2V3H8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16 3H22V9H20V5H16V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M22 16V21H16V19H20V16H22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 21H2V15H4V19H8V21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 3H21V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 3H3V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M15 21H21V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 21H3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
              <div className="editor-header">
                <input
                  type="text"
                  className="note-title-input"
                  value={selectedNote.title}
                  onChange={handleTitleChange}
                  placeholder="Note title"
                />

                <div className="editor-meta">
                  <div className="editor-actions">
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

                    <div className="editor-buttons">
                      <button
                        className="delete-note-btn"
                        onClick={() => setShowDeleteConfirm(true)}
                        title="Delete note"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
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

    {/* Delete Confirmation Modal */}
    {showDeleteConfirm && (
      <div className="modal-overlay">
        <div className="modal-content delete-confirm-modal">
          <div className="modal-header">
            <h3>Delete Note</h3>
            <button className="close-button" onClick={() => setShowDeleteConfirm(false)}>×</button>
          </div>
          <div className="modal-body">
            <p>Are you sure you want to delete "{selectedNote?.title}"?</p>
            <p className="warning-text">This action cannot be undone.</p>
          </div>
          <div className="modal-footer">
            <button className="cancel-btn" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
            <button className="delete-btn" onClick={handleDeleteNote}>Delete</button>
          </div>
        </div>
      </div>
    )}
    </div>
  );
};

export default NotesPage;
