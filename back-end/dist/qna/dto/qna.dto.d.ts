export declare class CreateQuestionDto {
    eventId: string;
    question: string;
    askedBy: string;
}
export declare class AnswerQuestionDto {
    answer: string;
    answeredBy?: string;
}
export declare class UpdateQuestionDto {
    question?: string;
}
