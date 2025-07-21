const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

const getNotes = async (req, res) => {
  try {
    const userId = req.user.id;

    const notes = await prisma.note.findMany({
      where: {
        userId: userId
      },
      include: {
        course: {
          select: {
            id: true,
            course_name: true,
            course_code: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    res.status(200).json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ message: 'Failed to fetch notes', error: error.message });
  }
};

const getNoteById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const note = await prisma.note.findFirst({
      where: {
        id: id,
        userId: userId
      },
      include: {
        course: {
          select: {
            id: true,
            course_name: true,
            course_code: true
          }
        }
      }
    });

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    res.status(200).json(note);
  } catch (error) {
    console.error('Error fetching note:', error);
    res.status(500).json({ message: 'Failed to fetch note', error: error.message });
  }
};

const createNote = async (req, res) => {
  try {
    const { title, content, courseId, tags } = req.body;
    const userId = req.user.id;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const newNote = await prisma.note.create({
      data: {
        title,
        content: content || '',
        userId,
        courseId: courseId || null,
        tags: tags || []
      },
      include: {
        course: {
          select: {
            id: true,
            course_name: true,
            course_code: true
          }
        }
      }
    });

    res.status(201).json(newNote);
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ message: 'Failed to create note', error: error.message });
  }
};

const updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, courseId, tags } = req.body;
    const userId = req.user.id;

    const existingNote = await prisma.note.findFirst({
      where: {
        id: id,
        userId: userId
      }
    });

    if (!existingNote) {
      return res.status(404).json({ message: 'Note not found or you do not have permission to update it' });
    }

    const updatedNote = await prisma.note.update({
      where: {
        id: id
      },
      data: {
        title: title !== undefined ? title : existingNote.title,
        content: content !== undefined ? content : existingNote.content,
        courseId: courseId !== undefined ? (courseId || null) : existingNote.courseId,
        tags: tags !== undefined ? tags : existingNote.tags,
        updatedAt: new Date()
      },
      include: {
        course: {
          select: {
            id: true,
            course_name: true,
            course_code: true
          }
        }
      }
    });

    res.status(200).json(updatedNote);
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ message: 'Failed to update note', error: error.message });
  }
};

const deleteNote = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existingNote = await prisma.note.findFirst({
      where: {
        id: id,
        userId: userId
      }
    });

    if (!existingNote) {
      return res.status(404).json({ message: 'Note not found or you do not have permission to delete it' });
    }

    await prisma.note.delete({
      where: {
        id: id
      }
    });

    res.status(200).json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ message: 'Failed to delete note', error: error.message });
  }
};

const getUserTags = async (req, res) => {
  try {
    const userId = req.user.id;

    const notes = await prisma.note.findMany({
      where: {
        userId: userId
      },
      select: {
        tags: true
      }
    });

    const allTags = notes.flatMap(note => note.tags);

    const uniqueTags = [...new Set(allTags)];

    res.status(200).json(uniqueTags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ message: 'Failed to fetch tags', error: error.message });
  }
};

module.exports = {
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  getUserTags
};
