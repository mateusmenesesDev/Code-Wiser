import { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { UTApi } from "uploadthing/server";
import { z } from "zod";
import {
  createProjectTemplateSchema,
  deleteTemplateSchema,
  updateTemplateBasicInfoInputSchema,
  updateTemplateStatusSchema,
} from "~/features/templates/schemas/template.schema";
import { bulkCreateSchema } from "~/features/templates/schemas/bulkCreate.schema";
import { adminProcedure } from "~/server/api/trpc";
import { createProjectTemplateData } from "../actions/projectTemplateActions";

export const projectTemplateMutations = {
  create: adminProcedure
    .input(createProjectTemplateSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await ctx.db.$transaction(async (prisma) => {
          const projectTemplate = await prisma.projectTemplate.create({
            data: createProjectTemplateData(input),
          });

          return projectTemplate.id;
        });
      } catch (error) {
        console.error("Create project template error:", error);

        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === "P2002") {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Project with this name already exists",
              cause: error,
            });
          }
          if (error.code === "P2011") {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Missing required fields",
              cause: error,
            });
          }
        }

        throw error;
      }
    }),

  createImage: adminProcedure
    .input(
      z.object({
        projectTemplateId: z.string(),
        images: z.array(
          z.object({
            url: z.string(),
            alt: z.string(),
            order: z.number(),
            uploadId: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { projectTemplateId, images } = input;

      const result = await ctx.db.projectTemplate.update({
        where: { id: projectTemplateId },
        data: {
          images: {
            create: images,
          },
        },
        include: {
          images: true,
        },
      });

      return result;
    }),

  delete: adminProcedure
    .input(deleteTemplateSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const deleted = await ctx.db.projectTemplate.delete({
          where: { id: input.id },
        });

        return deleted.id;
      } catch (error) {
        console.error("Error deleting project template:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete project template",
        });
      }
    }),

  deleteImage: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id } = input;

      const image = await ctx.db.projectImage.findUnique({
        where: { id },
      });

      if (!image) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Image not found",
        });
      }

      const fileKey = image.url.split("/").pop();

      if (!fileKey) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid file URL",
        });
      }

      try {
        const utApi = new UTApi();
        await utApi.deleteFiles(fileKey);

        const deletedImage = await ctx.db.projectImage.delete({
          where: { id },
        });

        return deletedImage.id;
      } catch (error) {
        console.error("Failed to delete from UploadThing:", error);
      }
    }),

  updateStatus: adminProcedure
    .input(updateTemplateStatusSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const updated = await ctx.db.projectTemplate.update({
          where: { id: input.id },
          data: { status: input.status },
          select: {
            id: true,
            title: true,
            status: true,
          },
        });

        return updated;
      } catch (error) {
        console.error("Error updating project template status:", error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update project template status",
        });
      }
    }),

  update: adminProcedure
    .input(updateTemplateBasicInfoInputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const {
          id,
          category,
          technologies,
          learningOutcomes,
          milestones,
          images,
          ...data
        } = input;

        const updated = await ctx.db.projectTemplate.update({
          where: { id },
          data: {
            ...data,
            ...(category && {
              category: {
                connectOrCreate: {
                  where: { name: category },
                  create: { name: category },
                },
              },
            }),
            ...(technologies && {
              technologies: {
                deleteMany: {},
                connectOrCreate: technologies.map((tech) => ({
                  where: { name: tech },
                  create: { name: tech },
                })),
              },
            }),
            ...(learningOutcomes && {
              learningOutcomes: {
                deleteMany: {},
                create: learningOutcomes.map((outcome) => ({
                  value: outcome,
                })),
              },
            }),
            ...(milestones && {
              milestones: {
                deleteMany: {},
                create: milestones.map((milestone, index) => ({
                  title: milestone,
                  order: index,
                })),
              },
            }),
          },
          include: {
            category: true,
            technologies: true,
            learningOutcomes: true,
            milestones: true,
          },
        });

        return updated;
      } catch (error) {
        console.error("Error updating project template:", error);

        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === "P2002") {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Project with this name already exists",
              cause: error,
            });
          }
          if (error.code === "P2011") {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Missing required fields",
              cause: error,
            });
          }
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update project template",
        });
      }
    }),

  bulkCreateTasksSprintsEpics: adminProcedure
    .input(
      z.object({
        projectTemplateId: z.string(),
        data: bulkCreateSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { projectTemplateId, data } = input;

      // Increase timeout to 30 seconds for large bulk operations
      return await ctx.db.$transaction(
        async (prisma) => {
          // Create epics first (in parallel)
          const epicTitleToId: Record<string, string> = {};
          const epicPromises = (data.epics || []).map(async (epicData) => {
            const epic = await prisma.epic.create({
              data: {
                title: epicData.title,
                description: epicData.description,
                projectTemplate: {
                  connect: { id: projectTemplateId },
                },
              },
            });
            return { title: epicData.title, id: epic.id };
          });

          const createdEpics = await Promise.all(epicPromises);
          for (const { title, id } of createdEpics) {
            epicTitleToId[title] = id;
          }

          // Create sprints (in parallel)
          const sprintTitleToId: Record<string, string> = {};
          const sprintCount = await prisma.sprint.count({
            where: { projectTemplateId },
          });

          const sprintsToCreate = data.sprints || [];
          const sprintPromises = sprintsToCreate.map(async (sprintData, i) => {
            if (!sprintData) return null;
            const sprint = await prisma.sprint.create({
              data: {
                title: sprintData.title,
                description: sprintData.description,
                startDate: sprintData.startDate
                  ? new Date(sprintData.startDate)
                  : null,
                endDate: sprintData.endDate
                  ? new Date(sprintData.endDate)
                  : null,
                order: sprintData.order ?? sprintCount + i,
                projectTemplate: {
                  connect: { id: projectTemplateId },
                },
              },
            });
            return { title: sprintData.title, id: sprint.id };
          });

          const createdSprints = await Promise.all(sprintPromises);
          for (const result of createdSprints) {
            if (result) {
              sprintTitleToId[result.title] = result.id;
            }
          }

          // Validate and prepare tasks
          const warnings: string[] = [];
          const tasksToCreate = (data.tasks || []).map((taskData) => {
            // Validate epic and sprint references
            if (taskData.epicTitle && !epicTitleToId[taskData.epicTitle]) {
              warnings.push(
                `Task "${taskData.title}": Epic "${taskData.epicTitle}" not found. Task will be created without epic.`
              );
            }
            if (
              taskData.sprintTitle &&
              !sprintTitleToId[taskData.sprintTitle]
            ) {
              warnings.push(
                `Task "${taskData.title}": Sprint "${taskData.sprintTitle}" not found. Task will be created without sprint.`
              );
            }

            return {
              title: taskData.title,
              description: taskData.description,
              type: taskData.type,
              priority: taskData.priority,
              tags: taskData.tags || [],
              blocked: taskData.blocked ?? false,
              blockedReason: taskData.blockedReason,
              status: taskData.status,
              order: taskData.order,
              storyPoints: taskData.storyPoints,
              dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
              epicId: taskData.epicTitle
                ? epicTitleToId[taskData.epicTitle] || null
                : null,
              sprintId: taskData.sprintTitle
                ? sprintTitleToId[taskData.sprintTitle] || null
                : null,
            };
          });

          // Create tasks in batches to avoid overwhelming the database
          const batchSize = 50;
          const taskBatches = [];
          for (let i = 0; i < tasksToCreate.length; i += batchSize) {
            taskBatches.push(tasksToCreate.slice(i, i + batchSize));
          }

          const tasks = [];
          for (const batch of taskBatches) {
            const batchPromises = batch.map(async (taskData) => {
              const task = await prisma.task.create({
                data: {
                  title: taskData.title,
                  description: taskData.description,
                  type: taskData.type,
                  priority: taskData.priority,
                  tags: taskData.tags,
                  blocked: taskData.blocked,
                  blockedReason: taskData.blockedReason,
                  status: taskData.status,
                  order: taskData.order,
                  storyPoints: taskData.storyPoints,
                  dueDate: taskData.dueDate,
                  projectTemplate: {
                    connect: { id: projectTemplateId },
                  },
                  epic: taskData.epicId
                    ? { connect: { id: taskData.epicId } }
                    : undefined,
                  sprint: taskData.sprintId
                    ? { connect: { id: taskData.sprintId } }
                    : undefined,
                },
              });
              return task;
            });
            const batchResults = await Promise.all(batchPromises);
            tasks.push(...batchResults);
          }

          if (warnings.length > 0) {
            console.warn("Bulk create warnings:", warnings);
          }

          return {
            epicsCreated: data.epics?.length || 0,
            sprintsCreated: data.sprints?.length || 0,
            tasksCreated: tasks.length,
            warnings: warnings.length > 0 ? warnings : undefined,
          };
        },
        {
          maxWait: 10000, // Maximum time to wait for a transaction slot
          timeout: 30000, // Maximum time the transaction can run (30 seconds)
        }
      );
    }),
};
