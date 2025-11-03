import mongoose from 'mongoose';

const collabSchema = new mongoose.Schema({
  noteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Note',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  role: {
    type: String,
    enum: ['viewer', 'editor'],
    default: 'editor',
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined'],
    default: 'pending',
  },
}, {
  timestamps: true,
});

const Collab = mongoose.model('Collab', collabSchema);

export default Collab;
