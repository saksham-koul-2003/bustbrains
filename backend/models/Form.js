import mongoose from 'mongoose';

const conditionSchema = new mongoose.Schema({
  questionKey: {
    type: String,
    required: true
  },
  operator: {
    type: String,
    enum: ['equals', 'notEquals', 'contains'],
    required: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  }
}, { _id: false });

const conditionalRulesSchema = new mongoose.Schema({
  logic: {
    type: String,
    enum: ['AND', 'OR'],
    required: true
  },
  conditions: {
    type: [conditionSchema],
    required: true
  }
}, { _id: false });

const questionSchema = new mongoose.Schema({
  questionKey: {
    type: String,
    required: true
  },
  airtableFieldId: {
    type: String,
    required: true
  },
  label: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['singleLineText', 'multilineText', 'singleSelect', 'multipleSelects', 'multipleAttachments'],
    required: true
  },
  required: {
    type: Boolean,
    default: false
  },
  conditionalRules: {
    type: conditionalRulesSchema,
    default: null
  },
  options: {
    type: [String],
    default: []
  }
}, { _id: false });

const formSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  airtableBaseId: {
    type: String,
    required: true
  },
  airtableTableId: {
    type: String,
    required: true
  },
  questions: {
    type: [questionSchema],
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Form', formSchema);

