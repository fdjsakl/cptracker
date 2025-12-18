import type { SolvedProblem } from "@/data/mock";

// AtCoder interfaces
interface AtCoderSubmission {
    id: number;
    epoch_second: number;
    problem_id: string;
    contest_id: string;
    user_id: string;
    language: string;
    point: number;
    length: number;
    result: string;
    execution_time: number | null;
}

interface AtCoderProblemModel {
    slope?: number;
    intercept?: number;
    variance?: number;
    difficulty?: number;
    discrimination?: number;
    irt_loglikelihood?: number;
    irt_users?: number;
    is_experimental?: boolean;
}

type AtCoderProblemModels = Record<string, AtCoderProblemModel>;

// AtCoder difficulty clipping function
function clipDifficulty(difficulty: number): number {
    return Math.round(
        difficulty >= 400 ? difficulty : 400 / Math.exp(1.0 - difficulty / 400)
    );
}

// Convert AtCoder difficulty to Codeforces rating equivalent
function convertAC2CFrating(a: number): number {
    const x1 = 0;
    const x2 = 3900;
    const y1 = -1000 + 60;
    const y2 = 4130 + 85;
    const res = ((x2 * (a - y1)) + (x1 * (y2 - a))) / (y2 - y1);
    return res | 0;
}

// Codeforces interfaces
interface CodeforcesSubmission {
    id: number;
    contestId: number;
    creationTimeSeconds: number;
    problem: {
        contestId: number;
        index: string;
        name: string;
        rating?: number;
        tags: string[];
    };
    verdict: string;
}

interface CodeforcesResponse {
    status: string;
    result: CodeforcesSubmission[];
}

export async function fetchCodeforces(handle: string): Promise<SolvedProblem[]> {
    const response = await fetch(`https://codeforces.com/api/user.status?handle=${handle}`);
    const data: CodeforcesResponse = await response.json();

    if (data.status !== "OK") {
        throw new Error("Failed to fetch Codeforces submissions");
    }

    const solvedMap = new Map<string, CodeforcesSubmission>();

    for (const submission of data.result) {
        if (submission.verdict === "OK") {
            const problemKey = `${submission.contestId}-${submission.problem.index}`;
            if (!solvedMap.has(problemKey) ||
                submission.creationTimeSeconds < solvedMap.get(problemKey)!.creationTimeSeconds) {
                solvedMap.set(problemKey, submission);
            }
        }
    }

    const problems: SolvedProblem[] = [];
    let id = 1;

    for (const submission of solvedMap.values()) {
        const date = new Date(submission.creationTimeSeconds * 1000);
        const dateStr = date.toISOString().replace("T", " ").slice(0, 19);

        problems.push({
            id: id++,
            题目: `https://codeforces.com/contest/${submission.contestId}/problem/${submission.problem.index}`,
            难度: submission.problem.rating?.toString() ?? "",
            题解: "",
            关键词: submission.problem.tags.join(", "),
            日期: dateStr,
        });
    }

    return problems;
}

export async function fetchAtCoder(handle: string): Promise<SolvedProblem[]> {
    // Fetch submissions and problem models in parallel
    const [submissionsResponse, modelsResponse] = await Promise.all([
        fetch(`https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user=${handle}&from_second=0`),
        fetch(`https://kenkoooo.com/atcoder/resources/problem-models.json`),
    ]);

    const submissions: AtCoderSubmission[] = await submissionsResponse.json();
    const problemModels: AtCoderProblemModels = await modelsResponse.json();

    // Filter AC submissions and keep earliest solve for each problem
    const solvedMap = new Map<string, AtCoderSubmission>();

    for (const submission of submissions) {
        if (submission.result === "AC") {
            const problemKey = submission.problem_id;
            if (!solvedMap.has(problemKey) ||
                submission.epoch_second < solvedMap.get(problemKey)!.epoch_second) {
                solvedMap.set(problemKey, submission);
            }
        }
    }

    const problems: SolvedProblem[] = [];
    let id = 1;

    for (const submission of solvedMap.values()) {
        const date = new Date(submission.epoch_second * 1000);
        const dateStr = date.toISOString().replace("T", " ").slice(0, 19);

        // Get difficulty and convert to CF rating
        const model = problemModels[submission.problem_id];
        let difficultyStr = "";
        if (model?.difficulty !== undefined) {
            const clippedDifficulty = clipDifficulty(model.difficulty);
            const cfRating = convertAC2CFrating(clippedDifficulty);
            difficultyStr = cfRating.toString();
        }

        problems.push({
            id: id++,
            题目: `https://atcoder.jp/contests/${submission.contest_id}/tasks/${submission.problem_id}`,
            难度: difficultyStr,
            题解: "",
            关键词: "",
            日期: dateStr,
        });
    }

    return problems;
}