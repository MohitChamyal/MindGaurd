const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['super_admin', 'admin'],
    default: 'admin'
  },
  profileImage: {
    type: String,
    default: null
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  id: false,
  timestamps: true
});

// Virtual property for name to maintain consistency with other models
adminSchema.virtual('name').get(function() {
  return this.fullName;
});

// Generate username from email before saving if not provided
adminSchema.pre('save', async function(next) {
  // If username is not set, generate from email
  if (!this.username) {
    this.username = this.email.split('@')[0] + '_admin';
  }
  next();
});

// Hash password before saving
adminSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Method to compare password
adminSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Ensure unique ID generation doesn't collide with other models
adminSchema.pre('save', function(next) {
  if (this.isNew) {
    // Add prefix to MongoDB ID to prevent collisions
    this._id = new mongoose.Types.ObjectId();
  }
  next();
});

// Configure toJSON and toObject to include virtuals
adminSchema.set('toJSON', { 
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret.password;
    return ret;
  }
});

adminSchema.set('toObject', { 
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret.password;
    return ret;
  }
});

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin; 