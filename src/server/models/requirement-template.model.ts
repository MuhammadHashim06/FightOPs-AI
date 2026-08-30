import { model, models, Schema, type InferSchemaType } from "mongoose";

const structuredFieldSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["text", "date", "time", "email", "number"],
      required: true,
    },
    required: {
      type: Boolean,
      default: true,
      required: true,
    },
    placeholder: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    _id: false,
  },
);

const requirementTemplateSchema = new Schema(
  {
    ownerUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: null,
      trim: true,
    },
    inputType: {
      type: String,
      enum: ["document", "text", "date", "number", "choice", "confirmation"],
      default: "document",
      required: true,
    },
    required: {
      type: Boolean,
      default: true,
      required: true,
    },
    priority: {
      type: String,
      enum: ["critical", "high", "medium", "low"],
      default: "medium",
      required: true,
    },
    dueDaysBeforeEvent: {
      type: Number,
      default: null,
    },
    reminderEnabled: {
      type: Boolean,
      default: false,
      required: true,
    },
    reminderDaysBeforeDue: {
      type: [Number],
      default: [],
      required: true,
    },
    reminderSubject: {
      type: String,
      default: null,
      trim: true,
    },
    reminderMessage: {
      type: String,
      default: null,
      trim: true,
    },
    structuredFields: {
      type: [structuredFieldSchema],
      default: [],
      required: true,
    },
    humanVerificationRequired: {
      type: Boolean,
      default: false,
      required: true,
    },
    isSignedAgreement: {
      type: Boolean,
      default: false,
      required: true,
    },
    acceptedFileTypes: {
      type: [String],
      default: [],
      required: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

requirementTemplateSchema.index({ ownerUserId: 1, sortOrder: 1 });

export type RequirementTemplateDocument = InferSchemaType<
  typeof requirementTemplateSchema
>;

export const RequirementTemplateMongoModel =
  models.RequirementTemplate ||
  model("RequirementTemplate", requirementTemplateSchema);
