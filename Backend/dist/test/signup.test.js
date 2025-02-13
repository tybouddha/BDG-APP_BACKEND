"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../app")); // Ton fichier principal Express (où app est créé)
const database_1 = require("../config/database");
// Mock de la base de données
jest.mock("../config/database", () => ({
    query: jest.fn(),
}));
describe("POST /signup", () => {
    const signupEndpoint = "/signup";
    it("Devrait créer un utilisateur avec succès", () => __awaiter(void 0, void 0, void 0, function* () {
        database_1.query.mockResolvedValueOnce({
            rows: [
                {
                    id: 1,
                    username: "testuser",
                    email: "test@mail.com",
                    created_at: "2025-02-11",
                },
            ],
        });
        const res = yield (0, supertest_1.default)(app_1.default).post(signupEndpoint).send({
            username: "testuser",
            email: "test@mail.com",
            password: "password123",
        });
        expect(res.status).toBe(201);
        expect(res.body.result).toBe(true);
        expect(res.body.user.username).toBe("testuser");
    }));
    it("Devrait échouer si l'utilisateur existe déjà", () => __awaiter(void 0, void 0, void 0, function* () {
        database_1.query.mockResolvedValueOnce({
            rows: [{ email: "test@mail.com" }],
        });
        const res = yield (0, supertest_1.default)(app_1.default).post(signupEndpoint).send({
            username: "testuser",
            email: "test@mail.com",
            password: "password123",
        });
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Un utilisateur avec cet email existe déjà.");
    }));
    it("Devrait échouer si un champ obligatoire est manquant", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(app_1.default)
            .post(signupEndpoint)
            .send({ email: "test@mail.com" });
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Champs manquants ou mal renseignés.");
    }));
});
