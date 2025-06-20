import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { Judge0ExecutionService } from '../../services/judge0-execution.service';
import { WebSocketService } from '../../services/websocket.service';

const prisma = new PrismaClient() as any;
const judge0Service = new Judge0ExecutionService();

// Validation schemas
const realTimeExecutionSchema = z.object({
  code: z.string().min(1),
  language: z.enum(['cpp', 'c', 'java', 'python', 'javascript']),
  problemId: z.string().cuid()
});

const finalSubmissionSchema = z.object({
  submissions: z.array(z.object({
    problemId: z.string().cuid(),
    code: z.string().min(1),
    language: z.enum(['cpp', 'c', 'java', 'python', 'javascript'])
  })).min(1)
});

/**
 * Start a new test session for a student
 */
export const startTestSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { testId } = req.params;
    
    // TODO: Implement actual test session logic
    res.status(200).json({ 
      message: 'Test session started',
      testId,
      status: 'success'
    });
  } catch (error) {
    console.error('Error starting test session:', error);
    res.status(500).json({ error: 'Failed to start test session' });
  }
};

/**
 * Get current test session state
 */
export const getTestSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { testId } = req.params;
    
    // TODO: Implement actual test session retrieval logic
    res.status(200).json({ 
      message: 'Test session retrieved',
      testId,
      status: 'success'
    });
  } catch (error) {
    console.error('Error getting test session:', error);
    res.status(500).json({ error: 'Failed to get test session' });
  }
};

/**
 * Submit code for a specific problem
 */
export const submitCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { testId } = req.params;
    
    // TODO: Implement actual code submission logic
    res.status(200).json({ 
      message: 'Code submitted',
      testId,
      status: 'success'
    });
  } catch (error) {
    console.error('Error submitting code:', error);
    res.status(500).json({ error: 'Failed to submit code' });
  }
};

/**
 * Update session heartbeat and current state
 */
export const updateHeartbeat = async (req: Request, res: Response): Promise<void> => {
  try {
    const { testId } = req.params;
    
    // TODO: Implement actual heartbeat logic
    res.status(200).json({ 
      message: 'Heartbeat updated',
      testId,
      status: 'success'
    });
  } catch (error) {
    console.error('Error updating heartbeat:', error);
    res.status(500).json({ error: 'Failed to update heartbeat' });
  }
};

/**
 * Record a penalty for the session
 */
export const recordPenalty = async (req: Request, res: Response): Promise<void> => {
  try {
    const { testId } = req.params;
    
    // TODO: Implement actual penalty recording logic
    res.status(200).json({ 
      message: 'Penalty recorded',
      testId,
      status: 'success'
    });
  } catch (error) {
    console.error('Error recording penalty:', error);
    res.status(500).json({ error: 'Failed to record penalty' });
  }
};

/**
 * Complete the test session
 */
export const completeTestSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { testId } = req.params;
    
    // TODO: Implement actual test completion logic
    res.status(200).json({ 
      message: 'Test session completed',
      testId,
      status: 'success'
    });
  } catch (error) {
    console.error('Error completing test session:', error);
    res.status(500).json({ error: 'Failed to complete test session' });
  }
};

/**
 * Run test cases for code without submitting
 */
export const runTestCases = async (req: Request, res: Response): Promise<void> => {
  try {
    const { testId } = req.params;
    
    // TODO: Implement actual test case running logic
    res.status(200).json({ 
      message: 'Test cases executed',
      testId,
      status: 'success'
    });
  } catch (error) {
    console.error('Error running test cases:', error);
    res.status(500).json({ error: 'Failed to run test cases' });
  }
};

/**
 * Join a test session
 */
export const joinTestSession = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    const { testId } = req.params;

    // Only students can join test sessions
    if (userRole !== 'STUDENT') {
      return res.status(403).json({ error: 'Only students can join test sessions' });
    }

    // Verify test exists and user has access
    const test = await prisma.codingTest.findFirst({
      where: {
        id: testId,
        class: {
          students: { some: { userId } }
        }
      },
      include: {
        class: true,
        problems: {
          select: {
            id: true,
            title: true,
            description: true,
            constraints: true,
            examples: true,
            difficulty: true,
            timeLimit: true,
            memoryLimit: true,
            order: true,
            testCases: {
              where: { isPublic: true },
              select: {
                id: true,
                input: true,
                expectedOutput: true,
                isPublic: true
              }
            }
          },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!test) {
      return res.status(404).json({ error: 'Test not found or access denied' });
    }

    // Check if test is active
    const now = new Date();
    if (now < test.startTime || now > test.endTime || !test.isActive) {
      return res.status(400).json({ error: 'Test is not currently active' });
    }

    // Find or create test session
    let session = await prisma.testSession.findUnique({
      where: {
        testId_userId: { testId, userId }
      },
      include: {
        submissions: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!session) {
      session = await prisma.testSession.create({
        data: {
          testId,
          userId,
          status: 'IN_PROGRESS'
        },
        include: {
          submissions: true
        }
      });
    }

    res.json({
      session: {
        id: session.id,
        status: session.status,
        currentProblemIndex: session.currentProblemIndex,
        penaltyCount: session.penaltyCount
      },
      test: {
        id: test.id,
        title: test.title,
        description: test.description,
        duration: test.duration,
        startTime: test.startTime,
        endTime: test.endTime,
        allowedLanguages: test.allowedLanguages,
        problems: test.problems
      },
      submissions: session.submissions
    });

  } catch (error) {
    console.error('Error joining test session:', error);
    res.status(500).json({ error: 'Failed to join test session' });
  }
};

/**
 * Execute code in real-time for testing (with rate limiting)
 */
export const executeRealTime = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { testId } = req.params;
    const validatedData = realTimeExecutionSchema.parse(req.body);

    // Verify test session
    const session = await prisma.testSession.findUnique({
      where: {
        testId_userId: { testId, userId }
      },
      include: {
        test: {
          include: {
            problems: {
              where: { id: validatedData.problemId },
              include: {
                testCases: {
                  where: { isPublic: true }
                }
              }
            }
          }
        }
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'Test session not found' });
    }

    if (session.status !== 'IN_PROGRESS') {
      return res.status(400).json({ error: 'Test session is not active' });
    }

    const problem = session.test.problems[0];
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    // Check if language is allowed
    if (!session.test.allowedLanguages.includes(validatedData.language)) {
      return res.status(400).json({ error: 'Language not allowed for this test' });
    }

    // Execute code with rate limiting
    const result = await judge0Service.executeRealTime(
      userId,
      validatedData.code,
      validatedData.language,
      problem.testCases.map((tc: any) => ({
        input: tc.input,
        expectedOutput: tc.expectedOutput
      })),
      problem.timeLimit,
      problem.memoryLimit
    );

    // Update last activity
    await prisma.testSession.update({
      where: { id: session.id },
      data: { lastActivity: new Date() }
    });

    res.json(result);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error executing real-time code:', error);
    res.status(500).json({ error: 'Code execution failed' });
  }
};

/**
 * Submit final solutions (queued for batch processing)
 */
export const submitFinalSolutions = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { testId } = req.params;
    const validatedData = finalSubmissionSchema.parse(req.body);

    // Verify test session
    const session = await prisma.testSession.findUnique({
      where: {
        testId_userId: { testId, userId }
      },
      include: {
        test: {
          include: {
            problems: {
              include: {
                testCases: true
              }
            }
          }
        }
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'Test session not found' });
    }

    if (session.status !== 'IN_PROGRESS') {
      return res.status(400).json({ error: 'Test session is not active' });
    }

    // Validate all problem IDs and languages
    const problemIds = session.test.problems.map((p: any) => p.id);
    for (const submission of validatedData.submissions) {
      if (!problemIds.includes(submission.problemId)) {
        return res.status(400).json({ error: `Invalid problem ID: ${submission.problemId}` });
      }
      if (!session.test.allowedLanguages.includes(submission.language)) {
        return res.status(400).json({ error: `Language ${submission.language} not allowed` });
      }
    }

    // Create submissions in database
    const createdSubmissions = await Promise.all(
      validatedData.submissions.map(submissionData => 
        prisma.testSubmission.create({
          data: {
            sessionId: session.id,
            problemId: submissionData.problemId,
            code: submissionData.code,
            language: submissionData.language,
            status: 'QUEUED'
          }
        })
      )
    );

    // Queue submissions for batch processing
    await Promise.all(
      createdSubmissions.map(submission => 
        judge0Service.queueForBatch(testId, submission.id)
      )
    );

    // Update session status
    await prisma.testSession.update({
      where: { id: session.id },
      data: { 
        status: 'SUBMITTED',
        lastActivity: new Date()
      }
    });

    res.json({
      message: 'Solutions submitted successfully',
      submissionIds: createdSubmissions.map(s => s.id),
      queuedForBatch: true
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error submitting final solutions:', error);
    res.status(500).json({ error: 'Submission failed' });
  }
};

/**
 * Get test session status and results
 */
export const getSessionStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { testId } = req.params;

    const session = await prisma.testSession.findUnique({
      where: {
        testId_userId: { testId, userId }
      },
      include: {
        submissions: {
          orderBy: { createdAt: 'desc' },
          include: {
            problem: {
              select: { title: true, difficulty: true }
            }
          }
        },
        penalties: {
          orderBy: { timestamp: 'desc' }
        }
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'Test session not found' });
    }

    res.json({
      session: {
        id: session.id,
        status: session.status,
        currentProblemIndex: session.currentProblemIndex,
        penaltyCount: session.penaltyCount,
        lastActivity: session.lastActivity
      },
      submissions: session.submissions,
      penalties: session.penalties
    });

  } catch (error) {
    console.error('Error getting session status:', error);
    res.status(500).json({ error: 'Failed to get session status' });
  }
};

/**
 * Get test session status for results page
 */
export const getTestSessionStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { testId } = req.params;

    // Find the test session for this user and test
    const session = await prisma.testSession.findFirst({
      where: {
        testId,
        userId
      },
      include: {
        test: {
          include: {
            problems: {
              orderBy: { order: 'asc' }
            }
          }
        },
        submissions: {
          include: {
            problem: {
              select: { id: true, title: true, difficulty: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!session) {
      res.status(404).json({ error: 'Test session not found' });
      return;
    }

    // Format the response
    const formattedSession = {
      id: session.id,
      status: session.status,
      startedAt: session.startedAt,
      submittedAt: session.submittedAt,
      submissions: session.submissions.map((sub: any) => ({
        id: sub.id,
        problemId: sub.problemId,
        code: sub.code,
        language: sub.language,
        status: sub.status,
        score: sub.score || 0,
        executionTime: sub.executionTime || 0,
        memoryUsed: sub.memoryUsed || 0,
        submittedAt: sub.createdAt,
        problem: sub.problem,
        judgeResponse: sub.judgeResponse
      }))
    };

    res.json({ session: formattedSession });

  } catch (error) {
    console.error('Error getting test session status:', error);
    res.status(500).json({ error: 'Failed to get test session status' });
  }
};

/**
 * Submit a single problem solution for immediate evaluation
 */
export const submitSingleProblem = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { testId } = req.params;
    const { problemId, code, language } = req.body;

    if (!problemId || !code || !language) {
      res.status(400).json({ error: 'Problem ID, code, and language are required' });
      return;
    }

    // Verify test session
    const session = await prisma.testSession.findUnique({
      where: {
        testId_userId: { testId, userId }
      },
      include: {
        test: {
          include: {
            problems: {
              where: { id: problemId },
              include: {
                testCases: true
              }
            }
          }
        }
      }
    });

    if (!session) {
      res.status(404).json({ error: 'Test session not found' });
      return;
    }

    if (session.status !== 'IN_PROGRESS') {
      res.status(400).json({ error: 'Test session is not active' });
      return;
    }

    const problem = session.test.problems[0];
    if (!problem) {
      res.status(404).json({ error: 'Problem not found' });
      return;
    }

    // Check if language is allowed
    if (!session.test.allowedLanguages.includes(language)) {
      res.status(400).json({ error: 'Language not allowed for this test' });
      return;
    }

    // Create submission in database
    const submission = await prisma.testSubmission.create({
      data: {
        sessionId: session.id,
        problemId: problem.id,
        code: code,
        language: language,
        status: 'PROCESSING',
        // submissionTime field doesn't exist - using createdAt instead
      }
    });

    // Execute immediately using Judge0
    try {
      await judge0Service.processSubmission(submission.id);
      
      // Fetch updated submission with results
      const updatedSubmission = await prisma.testSubmission.findUnique({
        where: { id: submission.id }
      });

      res.json({
        message: 'Submission processed successfully',
        submission: updatedSubmission
      });

    } catch (executionError) {
      // Update submission status to failed
      await prisma.testSubmission.update({
        where: { id: submission.id },
        data: { 
          status: 'SYSTEM_ERROR',
          judgeResponse: { error: 'Execution failed' }
        }
      });

      res.status(500).json({ 
        error: 'Code execution failed',
        submission: { id: submission.id, status: 'SYSTEM_ERROR', score: 0 }
      });
    }

  } catch (error) {
    console.error('Error submitting single problem:', error);
    res.status(500).json({ error: 'Submission failed' });
  }
}; 