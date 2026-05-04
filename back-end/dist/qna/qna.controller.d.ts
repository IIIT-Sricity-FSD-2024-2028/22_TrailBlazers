import { QnaService } from './qna.service';
import { CreateQuestionDto, AnswerQuestionDto, UpdateQuestionDto } from './dto/qna.dto';
export declare class QnaController {
    private readonly qnaService;
    constructor(qnaService: QnaService);
    findAll(eventId?: string, status?: string): import("./qna.service").QnAItem[];
    findMyQuestions(email: string): import("./qna.service").QnAItem[];
    getStats(eventId: string): object;
    findOne(id: string): import("./qna.service").QnAItem;
    create(dto: CreateQuestionDto): import("./qna.service").QnAItem;
    answer(id: string, dto: AnswerQuestionDto): import("./qna.service").QnAItem;
    update(id: string, dto: UpdateQuestionDto): import("./qna.service").QnAItem;
    remove(id: string): {
        message: string;
    };
}
