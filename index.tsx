import { GoogleGenAI } from "@google/genai";

declare global {
    interface Window {
        MathJax: any;
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // --- Gemini AI Setup ---
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // --- DOM Elements ---
    const chatWindow = document.getElementById('chat-window') as HTMLDivElement;
    const historyView = document.getElementById('history-view') as HTMLDivElement;
    const inputWrapper = document.querySelector('.input-wrapper') as HTMLDivElement;
    const userInput = document.getElementById('user-input') as HTMLInputElement;
    const sendButton = document.getElementById('send-button') as HTMLButtonElement;
    const micButton = document.getElementById('mic-button') as HTMLButtonElement;
    const attachFileButton = document.getElementById('attach-file-button') as HTMLButtonElement;
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    const filePreviewContainer = document.getElementById('file-preview-container') as HTMLDivElement;
    const suggestionButtons = document.querySelectorAll('.suggestion-btn');
    const charButtons = document.querySelectorAll('.char-btn');
    const menuToggle = document.getElementById('menu-toggle') as HTMLButtonElement;
    const sidebarSearch = document.getElementById('sidebar-search') as HTMLInputElement;
    const searchResultsContainer = document.getElementById('search-results') as HTMLDivElement;
    const navChat = document.getElementById('nav-chat') as HTMLAnchorElement;
    const navHistory = document.getElementById('nav-history') as HTMLAnchorElement;
    const themeToggle = document.getElementById('theme-toggle') as HTMLInputElement;
    const inputSuggestions = document.getElementById('input-suggestions') as HTMLDivElement;
    const progressBarInner = document.getElementById('progress-bar-inner') as HTMLDivElement;
    const progressPercentage = document.getElementById('progress-percentage') as HTMLSpanElement;


    // --- Application State ---
    const loadLessonHistory = (): any[] => {
        try {
            const savedHistory = localStorage.getItem('lessonHistory');
            if (savedHistory) {
                const parsedHistory = JSON.parse(savedHistory);
                return Array.isArray(parsedHistory) ? parsedHistory : [];
            }
            return [];
        } catch (e) {
            console.error("Failed to load lesson history from localStorage", e);
            return [];
        }
    };
    
    const saveLessonHistory = () => {
        try {
            localStorage.setItem('lessonHistory', JSON.stringify(appState.lessonHistory));
        } catch (e) {
            console.error("Failed to save lesson history to localStorage", e);
        }
    };

    const loadUserProgress = (): Set<string> => {
        try {
            const savedProgress = localStorage.getItem('userProgress');
            if (savedProgress) {
                const parsed = JSON.parse(savedProgress);
                return new Set(Array.isArray(parsed) ? parsed : []);
            }
            return new Set();
        } catch (e) {
            console.error("Failed to load user progress", e);
            return new Set();
        }
    };

    const saveUserProgress = () => {
        try {
            localStorage.setItem('userProgress', JSON.stringify(Array.from(appState.userProgress.masteredTopics)));
        } catch (e) {
            console.error("Failed to save user progress", e);
        }
    };


    let appState = {
        mode: 'idle', // 'idle', 'quiz', 'tutor', 'practice'
        lessonHistory: loadLessonHistory(),
        stagedFile: null as File | null,
        userProgress: {
            masteredTopics: loadUserProgress()
        },
        quiz: {
            topic: null as string | null,
            questionIndex: 0,
            score: 0,
            difficulty: 'medium',
            questions: [] as any[],
            currentQuestion: null as any | null,
            askedQuestions: [] as string[]
        },
        practice: {
            topic: null as string | null,
            exerciseIndex: 0,
            exercises: [] as any[],
            currentExercise: null as any | null,
        }
    };

    // --- Simulated Database ---
    const knowledgeBase = {
        lessons: {
            "théorème de pythagore": {
                title: "Théorème de Pythagore",
                svg: `<div class="lesson-diagram">
                              <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
                                <polygon points="10,110 10,10 110,110" fill="#f0f6ff" stroke="#4a90e2" stroke-width="2"/>
                                <rect x="10" y="90" width="20" height="20" fill="none" stroke="#4a90e2" stroke-width="1.5" stroke-dasharray="2,2" />
                                <text x="50" y="118" font-family="inherit" font-size="12px" fill="var(--text-color-dark)">a</text>
                                <text x="0" y="65" font-family="inherit" font-size="12px" fill="var(--text-color-dark)">b</text>
                                <text x="55" y="70" font-family="inherit" font-size="12px" fill="var(--text-color-dark)" transform="rotate(-45 60 65)">c</text>
                              </svg>
                          </div>`,
                definition: "Dans un triangle rectangle, le carré de la longueur de l'hypoténuse (le côté opposé à l'angle droit) est égal à la somme des carrés des longueurs des deux autres côtés.",
                formula: "\\(a^2 + b^2 = c^2\\)",
                example: "Si un triangle rectangle a des côtés de longueurs \\(a=3\\) et \\(b=4\\), alors l'hypoténuse \\(c\\) se calcule ainsi : \\(3^2 + 4^2 = 9 + 16 = 25\\). Donc, \\(c = \\sqrt{25} = 5\\).",
                usage: "Ce théorème est fondamental en géométrie pour calculer des distances, en architecture pour assurer des angles droits, ou même en navigation."
            },
             "fonctions du second degré": {
                title: "Fonctions du second degré (ou quadratiques)",
                 svg: `<div class="lesson-diagram">
                            <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
                                <line x1="10" y1="110" x2="110" y2="110" stroke="#aaa" stroke-width="1"/>
                                <line x1="15" y1="15" x2="15" y2="115" stroke="#aaa" stroke-width="1"/>
                                <polygon points="110,110 105,107 105,113" fill="#aaa"/>
                                <polygon points="15,15 12,20 18,20" fill="#aaa"/>
                                <text x="108" y="105" font-size="8px" fill="var(--text-color-dark)">x</text>
                                <text x="20" y="20" font-size="8px" fill="var(--text-color-dark)">f(x)</text>
                                <path d="M 30 100 C 40 20, 80 20, 90 100" stroke="#4a90e2" stroke-width="2.5" fill="none"/>
                                <text x="50" y="100" font-size="8px" fill="var(--text-color-dark)">Parabole</text>
                            </svg>
                        </div>`,
                definition: "Une fonction du second degré est une fonction polynomiale de degré 2. Sa représentation graphique est une parabole.",
                formula: "\\(f(x) = ax^2 + bx + c\\), avec \\(a \\neq 0\\)",
                example: "Pour \\(f(x) = x^2 - 2x - 3\\), la parabole est tournée vers le haut (car \\(a=1 > 0\\)). Les racines (où \\(f(x)=0\\)) sont \\(x=-1\\) et \\(x=3\\).",
                usage: "Elles modélisent des trajectoires (lancer de balle), des surfaces, et permettent d'optimiser des problèmes (profit maximal, etc.)."
            }
        },
        quizzes: {
            "fonctions du second degré": [
                { difficulty: 'easy', question: "Pour \\(f(x) = 3x^2 - 5x + 1\\), quelle est la valeur de 'a' ?", answer: "3", explanation: "Le coefficient 'a' est le nombre qui multiplie \\(x^2\\)." },
                { difficulty: 'medium', question: "Quelle est la forme de la courbe d'une fonction du second degré ?", answer: "parabole", explanation: "La représentation graphique d'une fonction quadratique est toujours une parabole." },
                { difficulty: 'medium', question: "Si le discriminant (\\(\\Delta\\)) est positif, combien de racines réelles l'équation a-t-elle ?", answer: "2", explanation: "Un discriminant positif (\\(\\Delta > 0\\)) indique qu'il y a deux solutions réelles distinctes." },
                { difficulty: 'hard', question: "Trouvez le sommet de la parabole \\(f(x) = x^2 - 4x + 5\\). Répondez sous la forme (x,y).", answer: "(2,1)", explanation: "L'abscisse du sommet est \\(-\\frac{b}{2a}\\), soit \\(-\\frac{-4}{2 \\cdot 1} = 2\\). L'ordonnée est \\(f(2) = 2^2 - 4(2) + 5 = 1\\)." },
                { difficulty: 'hard', question: "Factorisez \\(x^2 - 5x + 6\\).", answer: "(x-2)(x-3)", explanation: "On cherche deux nombres dont la somme est 5 et le produit est 6. Ces nombres sont 2 et 3." }
            ],
             "théorème de pythagore": [
                { difficulty: 'easy', question: "Le théorème de Pythagore s'applique à quel type de triangle ?", answer: "rectangle", explanation: "Le théorème ne s'applique qu'aux triangles rectangles." },
                { difficulty: 'medium', question: "Si \\(a=6\\) et \\(b=8\\), que vaut \\(c\\) (l'hypoténuse) ?", answer: "10", explanation: "\\(6^2 + 8^2 = 36 + 64 = 100\\). La racine carrée de 100 est 10." },
                { difficulty: 'medium', question: "Le plus long côté d'un triangle rectangle s'appelle...", answer: "hypoténuse", explanation: "L'hypoténuse est toujours le côté opposé à l'angle droit et le plus long." },
                { difficulty: 'hard', question: "Un écran 16:9 a une diagonale de 20 pouces. Quelle est approximativement sa largeur ? (Répondez avec un entier)", answer: "17", explanation: "On résout \\((16x)^2 + (9x)^2 = 20^2 \\Rightarrow 337x^2 = 400 \\Rightarrow x \\approx 1.09\\). Largeur = \\(16x \\approx 17.4\\)." },
                { difficulty: 'hard', question: "Un triangle avec des côtés de 5, 12 et 13 est-il rectangle ?", answer: "oui", explanation: "Oui, car \\(5^2 + 12^2 = 25 + 144 = 169\\), et \\(13^2 = 169\\). L'égalité \\(a^2+b^2=c^2\\) est vérifiée." }
            ]
        },
        practiceExercises: {
            "théorème de pythagore": [
                { problem: "Un triangle rectangle a un côté de 5 cm et un autre de 12 cm. Quelle est la longueur de l'hypoténuse ?" },
                { problem: "La diagonale d'un carré mesure 10 cm. Quelle est la longueur d'un côté ? (arrondir à deux décimales)" },
                { problem: "Une échelle de 5m est appuyée contre un mur. Son pied est à 3m du mur. À quelle hauteur sur le mur l'échelle arrive-t-elle ?" }
            ],
            "fonctions du second degré": [
                { problem: "Trouvez les racines de l'équation \\(x^2 - 7x + 10 = 0\\)." },
                { problem: "Quel est le sommet de la parabole définie par \\(f(x) = -2x^2 + 8x - 5\\) ?" },
                { problem: "Factorisez l'expression \\(2x^2 + 5x - 3\\)." }
            ]
        }
    };

    const uniqueSuggestions = [...new Set([
        ...Object.values(knowledgeBase.lessons).map(l => l.title),
        ...Object.keys(knowledgeBase.quizzes).map(q => `Quiz sur ${q}`),
        ...Object.keys(knowledgeBase.practiceExercises).map(p => `Exercices sur ${p}`),
        "Explique-moi le théorème de Pythagore",
        "Aide-moi sur un exercice",
        "Je veux m'entraîner",
    ])];
    
    // --- Theme Management ---
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    themeToggle.checked = savedTheme === 'dark';

    themeToggle.addEventListener('change', () => {
        if (themeToggle.checked) {
            document.body.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
        }
    });

    // --- Speech Recognition ---
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition: any;
    let isListening = false;

    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.lang = 'fr-FR';
        recognition.interimResults = true;
        recognition.continuous = false;

        micButton.style.display = 'flex';

        micButton.addEventListener('click', () => {
            if (isListening) {
                recognition.stop();
            } else {
                recognition.start();
            }
        });

        recognition.onstart = () => {
            isListening = true;
            micButton.classList.add('listening');
            userInput.placeholder = "Je vous écoute...";
        };

        recognition.onend = () => {
            isListening = false;
            micButton.classList.remove('listening');
            userInput.placeholder = "Posez votre question de maths...";
        };

        recognition.onerror = (event: any) => {
            console.error('Erreur de reconnaissance vocale:', event.error);
            if(event.error !== 'no-speech' && event.error !== 'aborted') {
               addMessage(`Désolé, une erreur est survenue avec la reconnaissance vocale : ${event.error}`, 'ai');
            }
        };
        
        recognition.onresult = (event: any) => {
            const transcript = Array.from(event.results)
                .map((result: any) => result[0])
                .map((result: any) => result.transcript)
                .join('');
  
            userInput.value = transcript;
        };

    } else {
        console.warn("L'API Web Speech n'est pas supportée par ce navigateur.");
        micButton.style.display = 'none';
    }

    // --- Functions ---
    
    const updateProgressBar = () => {
        const totalTopics = Object.keys(knowledgeBase.quizzes).length;
        const masteredTopicsCount = appState.userProgress.masteredTopics.size;
        
        if (totalTopics === 0) return;

        const percentage = Math.round((masteredTopicsCount / totalTopics) * 100);
        
        progressBarInner.style.width = `${percentage}%`;
        progressPercentage.textContent = `${percentage}% Maîtrisé`;
    };

    const showChatView = () => {
        historyView.style.display = 'none';
        chatWindow.style.display = 'flex';
        inputWrapper.style.display = 'block';

        document.querySelector('#sidebar nav a.active')?.classList.remove('active');
        navChat.classList.add('active');
    };

    const showHistoryView = () => {
        chatWindow.style.display = 'none';
        inputWrapper.style.display = 'none';
        historyView.style.display = 'block';

        document.querySelector('#sidebar nav a.active')?.classList.remove('active');
        navHistory.classList.add('active');

        historyView.innerHTML = `<h2>Historique des leçons consultées</h2>`;
        if (appState.lessonHistory.length === 0) {
            historyView.innerHTML += `<p class="empty-history">Vous n'avez pas encore consulté de leçons.</p>`;
        } else {
            const ul = document.createElement('ul');
            appState.lessonHistory.slice().reverse().forEach((item: any) => {
                const li = document.createElement('li');
                li.innerHTML = `<a href="#" data-topic="${item.topic}">${item.title}</a>`;
                ul.appendChild(li);
            });
            historyView.appendChild(ul);

            historyView.querySelectorAll('a[data-topic]').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const topic = (e.currentTarget as HTMLAnchorElement).dataset.topic;
                    if (topic) generateLesson(topic);
                });
            });
        }
    };
    
    const insertAtCursor = (text: string) => {
        const startPos = userInput.selectionStart ?? 0;
        const endPos = userInput.selectionEnd ?? 0;
        userInput.value = userInput.value.substring(0, startPos) + text + userInput.value.substring(endPos);
        const newPos = startPos + text.length;
        userInput.selectionStart = newPos;
        userInput.selectionEnd = newPos;
        userInput.focus();
    };

    const addMessage = (text: string, sender: 'user' | 'ai', attachment: any = null) => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;

        const icon = document.createElement('div');
        icon.className = 'icon';
        icon.textContent = sender === 'ai' ? 'IA' : 'Moi';
        
        const content = document.createElement('div');
        content.className = 'message-content';
        
        let messageHTML = text;
        if (attachment) {
            messageHTML += `<div class="user-attachment-preview">`;
            if (attachment.type.startsWith('image/')) {
                messageHTML += `<img src="${attachment.previewUrl}" alt="Pièce jointe">`;
            } else {
                messageHTML += `<div class="file-info">📎 ${attachment.name}</div>`;
            }
            messageHTML += `</div>`;
        }
        content.innerHTML = messageHTML;

        messageDiv.appendChild(icon);
        messageDiv.appendChild(content);

        chatWindow.appendChild(messageDiv);
        chatWindow.scrollTop = chatWindow.scrollHeight;

        if (window.MathJax) {
            window.MathJax.typesetPromise([messageDiv]).catch((err: any) => {
                console.error('Erreur de rendu MathJax :', err);
            });
        }
    };

    const showTypingIndicator = () => {
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'message ai-message';
        typingIndicator.innerHTML = `<div class="icon">IA</div>
            <div class="message-content">
                <div class="typing-indicator">
                    <div class="dot"></div><div class="dot"></div><div class="dot"></div>
                </div>
            </div>`;
        chatWindow.appendChild(typingIndicator);
        chatWindow.scrollTop = chatWindow.scrollHeight;
        return typingIndicator;
    };

    const hideTypingIndicator = (indicator: HTMLElement) => {
        if (indicator && indicator.parentNode === chatWindow) {
            chatWindow.removeChild(indicator);
        }
    };
    
    const aiRespond = (response: string | (() => string), delay = 1000) => {
        const typingIndicator = showTypingIndicator();

        setTimeout(() => {
            hideTypingIndicator(typingIndicator);
            const responseText = typeof response === 'function' ? response() : response;
            addMessage(responseText, 'ai');
        }, delay);
    };

    const getTutorResponse = async (query: string, file: File): Promise<string> => {
        try {
            const base64Image = await fileToBase64(file);
            const mimeType = file.type;
            const imageDataPart = {
                inlineData: {
                    mimeType: mimeType,
                    data: base64Image.split(',')[1],
                },
            };
    
        const textPart = {
            text: `Requête de l'utilisateur : "${query || 'Aucune question spécifique, demande générale d\'aide.'}". Analyse l'image et la requête. Pose une question directrice pour l'aider à résoudre le problème étape par étape. Ne donne jamais la réponse finale.`
        };

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [imageDataPart, textPart] },
                config: {
                    systemInstruction: "Tu es MathIA, un tuteur de mathématiques sympathique et encourageant. Ton but est de guider les élèves vers la solution sans la leur donner. Utilise la méthode socratique, en posant des questions pour stimuler leur réflexion.",
                }
            });
            return response.text;
        } catch (error) {
            console.error("Error calling Gemini API:", error);
            return "Désolé, une erreur est survenue en analysant l'image. Pourriez-vous réessayer ?";
        }
    }
    
    const handleUserInput = async () => {
        const query = userInput.value.trim();
        const file = appState.stagedFile;

        if (!query && !file) return;

        userInput.value = '';

        if (file) {
            const attachment = {
                name: file.name,
                type: file.type,
                previewUrl: URL.createObjectURL(file)
            };
            addMessage(query, 'user', attachment);
            clearStagedFile();

            const typingIndicator = showTypingIndicator();
            const aiResponse = await getTutorResponse(query, file);
            hideTypingIndicator(typingIndicator);
            addMessage(aiResponse, 'ai');

            appState.mode = 'tutor';
            return;
        }
        
        addMessage(query, 'user');

        if (appState.mode === 'quiz') {
            processQuizAnswer(query);
            return;
        }
        
        if (appState.mode === 'practice') {
            processPracticeAnswer(query);
            return;
        }

        const lowerCaseQuery = query.toLowerCase();
        if (lowerCaseQuery.includes('explique') || lowerCaseQuery.includes('concept')) {
            const topic = findTopic(lowerCaseQuery, Object.keys(knowledgeBase.lessons));
            if (topic) generateLesson(topic);
            else aiRespond("De quel concept mathématique aimerais-tu que je te parle ?");
        } else if (lowerCaseQuery.includes('quiz')) {
             const topic = findTopic(lowerCaseQuery, Object.keys(knowledgeBase.quizzes));
             if(topic) startQuiz(topic);
             else aiRespond("Super ! Sur quel sujet veux-tu être interrogé ? Par exemple : le théorème de Pythagore.");
        } else if (lowerCaseQuery.includes('pratiquer') || lowerCaseQuery.includes('entraînement') || lowerCaseQuery.includes('exercices sur')) {
            const topic = findTopic(lowerCaseQuery, Object.keys(knowledgeBase.practiceExercises));
            if (topic) startPracticeMode(topic);
            else aiRespond("Super ! Sur quel sujet veux-tu t'entraîner ? Par exemple : fonctions du second degré.");
        } else if (lowerCaseQuery.includes('exercice') || lowerCaseQuery.includes('aide')) {
            startTutorSession();
        } else {
             const topic = findTopic(lowerCaseQuery, Object.keys(knowledgeBase.lessons));
             if (topic) {
                generateLesson(topic)
             } else {
                aiRespond("Je ne suis pas sûr de comprendre. Tu peux me demander d'expliquer un concept, de te donner un quiz, de t'entraîner, ou de t'aider sur un exercice en joignant un fichier.");
             }
        }
    };
    
    const findTopic = (query: string, topics: string[]) => {
        return topics.find(topic => query.includes(topic));
    };
    
    const generateLesson = (topic: string) => {
        const lesson = knowledgeBase.lessons[topic as keyof typeof knowledgeBase.lessons];
        if (!lesson) return;

        if (!appState.lessonHistory.some((item: any) => item.topic === topic)) {
            appState.lessonHistory.push({ topic: topic, title: lesson.title, formula: lesson.formula });
            saveLessonHistory();
        }

        if (historyView.style.display !== 'none') {
            showChatView();
        }

        addMessage(`Ok, parlons du sujet : <strong>${lesson.title}</strong>`, 'ai');
        
        let html = '';
        if (lesson.svg) {
            html += lesson.svg;
        }
        html += `
            <strong>${lesson.title}</strong>
            <p><b>Définition :</b> ${lesson.definition}</p>
            <p><b>Formule :</b> ${lesson.formula}</p>
            <p><b>Exemple :</b> ${lesson.example}</p>
            <p><b>Cas d'usage :</b> ${lesson.usage}</p>
        `;
        aiRespond(html);
    };
    
    const startTutorSession = () => {
        appState.mode = 'tutor';
        aiRespond("Bien sûr ! Joignez une photo ou un PDF de votre exercice. Dites-moi ensuite ce que vous avez déjà essayé ou ce qui vous bloque, et nous le résoudrons ensemble, étape par étape.");
    };
    
    // --- Quiz Functions ---
    const startQuiz = (topic: string) => {
        const questions = knowledgeBase.quizzes[topic as keyof typeof knowledgeBase.quizzes];
        if (!questions) {
            aiRespond("Désolé, je n'ai pas de quiz sur ce sujet pour le moment.");
            return;
        }
        appState.mode = 'quiz';
        appState.quiz = {
            topic,
            questionIndex: 0,
            score: 0,
            difficulty: 'medium',
            questions: questions,
            currentQuestion: null,
            askedQuestions: []
        };
        aiRespond(`Parfait, commençons un quiz adaptatif sur : <strong>${topic}</strong>. Bonne chance !`, 500);
        setTimeout(askNextQuizQuestion, 1500);
    };
    
    const findNextQuestion = () => {
        const { difficulty, questions, askedQuestions } = appState.quiz;
        
        const difficultyLevels = ['easy', 'medium', 'hard'];
        let potentialQuestions = [];

        potentialQuestions = questions.filter((q: any) => q.difficulty === difficulty && !askedQuestions.includes(q.question));

        if (potentialQuestions.length === 0) {
             const otherLevels = difficultyLevels.filter(level => level !== difficulty);
             for (const level of otherLevels) {
                 potentialQuestions = questions.filter((q: any) => q.difficulty === level && !askedQuestions.includes(q.question));
                 if (potentialQuestions.length > 0) break;
             }
        }
        
        if (potentialQuestions.length === 0) {
            return null;
        }

        const randomIndex = Math.floor(Math.random() * potentialQuestions.length);
        return potentialQuestions[randomIndex];
    }

    const askNextQuizQuestion = () => {
         if (appState.quiz.questionIndex >= 5) { 
            endQuiz();
            return;
         }
         
         const nextQuestion = findNextQuestion();

         if (!nextQuestion) {
            endQuiz();
            return;
         }
         
         appState.quiz.currentQuestion = nextQuestion;
         appState.quiz.askedQuestions.push(nextQuestion.question);

         aiRespond(`<strong>Question ${appState.quiz.questionIndex + 1}/5 (Niveau: ${appState.quiz.difficulty}):</strong> ${nextQuestion.question}`);
    };

    const processQuizAnswer = (answer: string) => {
        const { currentQuestion } = appState.quiz;
        if (!currentQuestion) return;
        
        if (answer.toLowerCase().includes((currentQuestion as any).answer.toLowerCase())) {
            appState.quiz.score++;
            aiRespond("C'est correct ! 👍", 500);
            if (appState.quiz.difficulty === 'easy') appState.quiz.difficulty = 'medium';
            else if (appState.quiz.difficulty === 'medium') appState.quiz.difficulty = 'hard';
        } else {
            aiRespond(`Ce n'est pas tout à fait ça. La bonne réponse était <strong>${(currentQuestion as any).answer}</strong>.<br><em>Explication : ${(currentQuestion as any).explanation}</em>`, 500);
            if (appState.quiz.difficulty === 'hard') appState.quiz.difficulty = 'medium';
            else if (appState.quiz.difficulty === 'medium') appState.quiz.difficulty = 'easy';
        }
        
        appState.quiz.questionIndex++;
        setTimeout(askNextQuizQuestion, 2000);
    };
    
    const endQuiz = () => {
        const { score, questionIndex, topic } = appState.quiz;
        let message = `Quiz terminé ! Ton score est de <strong>${score}/${questionIndex}</strong>.`;
        if (score >= 4) {
            message += "<br>Excellent travail, tu maîtrises le sujet ! 💪";
            if (topic) {
                appState.userProgress.masteredTopics.add(topic);
                saveUserProgress();
                updateProgressBar();
            }
        } else if (score >= 2) {
            message += "<br>Pas mal du tout ! Continue de t'entraîner. 🙂";
        } else {
            message += "<br>Ne te décourage pas, revois la leçon et réessaye ! L'important c'est d'apprendre. 🧠";
        }
        
        aiRespond(message);
        appState.mode = 'idle';
        appState.quiz.currentQuestion = null;
    };

    // --- Practice Mode Functions ---
    const startPracticeMode = (topic: string) => {
        const exercises = knowledgeBase.practiceExercises[topic as keyof typeof knowledgeBase.practiceExercises];
        if (!exercises || exercises.length === 0) {
            aiRespond("Désolé, je n'ai pas d'exercices de pratique sur ce sujet pour le moment.");
            return;
        }
        appState.mode = 'practice';
        appState.practice = {
            topic,
            exerciseIndex: 0,
            exercises: [...exercises].sort(() => 0.5 - Math.random()), // Shuffle exercises
            currentExercise: null,
        };
        aiRespond(`Très bien ! Démarrons une session d'entraînement sur : <strong>${topic}</strong>. Fais de ton mieux !`, 500);
        setTimeout(askNextPracticeExercise, 1500);
    };

    const askNextPracticeExercise = () => {
         const { exerciseIndex, exercises } = appState.practice;
         if (exerciseIndex >= exercises.length) { 
            endPracticeMode();
            return;
         }
         
         const nextExercise = exercises[exerciseIndex];
         appState.practice.currentExercise = nextExercise;

         aiRespond(`<strong>Exercice ${exerciseIndex + 1}/${exercises.length}:</strong> ${nextExercise.problem}`);
    };

    const getPracticeFeedback = async (problem: string, userAnswer: string): Promise<string> => {
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Évalue la réponse de l'élève. Problème: "${problem}". Réponse de l'élève: "${userAnswer}". Si la réponse est correcte, félicite-le et donne une brève explication. Si elle est incorrecte, ne donne PAS la bonne réponse, mais guide-le avec une question ou une piste pour l'aider à corriger son erreur. Sois encourageant.`,
                config: {
                    systemInstruction: "Tu es MathIA, un tuteur de mathématiques encourageant. Ton rôle est de fournir un feedback constructif sur les exercices de pratique.",
                }
            });
            return response.text;
        } catch (error) {
            console.error("Error calling Gemini API for practice feedback:", error);
            return "Désolé, une erreur est survenue. Passons à la suite.";
        }
    };
    
    const processPracticeAnswer = async (answer: string) => {
        const { currentExercise } = appState.practice;
        if (!currentExercise) return;

        const typingIndicator = showTypingIndicator();
        const feedback = await getPracticeFeedback(currentExercise.problem, answer);
        hideTypingIndicator(typingIndicator);
        addMessage(feedback, 'ai');

        appState.practice.exerciseIndex++;
        setTimeout(askNextPracticeExercise, 2500);
    };
    
    const endPracticeMode = () => {
        aiRespond("Session d'entraînement terminée ! Excellent travail. Continue comme ça ! 👍");
        appState.mode = 'idle';
        appState.practice.currentExercise = null;
    };
    
    const handleSearchInput = () => {
        const query = sidebarSearch.value.trim();
        searchResultsContainer.innerHTML = '';

        if (query.length < 2) {
            return;
        }

        const lowerCaseQuery = query.toLowerCase();

        const matchingLessons = Object.entries(knowledgeBase.lessons).filter(([key, lesson]) => 
            key.toLowerCase().includes(lowerCaseQuery) || lesson.title.toLowerCase().includes(lowerCaseQuery)
        );
        const matchingQuizzes = Object.keys(knowledgeBase.quizzes).filter(topic => topic.toLowerCase().includes(lowerCaseQuery));
        const matchingPractice = Object.keys(knowledgeBase.practiceExercises).filter(topic => topic.toLowerCase().includes(lowerCaseQuery));

        if (matchingLessons.length === 0 && matchingQuizzes.length === 0 && matchingPractice.length === 0) {
            searchResultsContainer.innerHTML = `<div class="no-results">Aucun résultat trouvé.</div>`;
            return;
        }
        
        const highlightMatch = (text: string, query: string) => {
            if (!query) return text;
            const escapedQuery = query.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
            const regex = new RegExp(`(${escapedQuery})`, 'gi');
            return text.replace(regex, '<strong>$1</strong>');
        };

        matchingLessons.forEach(([key, lesson]) => {
            const item = document.createElement('a');
            item.className = 'search-result-item';
            item.dataset.lessonTopic = key;
            item.innerHTML = `${highlightMatch(lesson.title, query)} <span class="result-type result-type-lesson">Leçon</span>`;
            searchResultsContainer.appendChild(item);
        });
        
        matchingQuizzes.forEach(topic => {
            const item = document.createElement('a');
            item.className = 'search-result-item';
            item.dataset.quizTopic = topic;
            const displayName = topic.charAt(0).toUpperCase() + topic.slice(1);
            item.innerHTML = `${highlightMatch(displayName, query)} <span class="result-type result-type-quiz">Quiz</span>`;
            searchResultsContainer.appendChild(item);
        });

        matchingPractice.forEach(topic => {
            const item = document.createElement('a');
            item.className = 'search-result-item';
            item.dataset.practiceTopic = topic;
            const displayName = topic.charAt(0).toUpperCase() + topic.slice(1);
            item.innerHTML = `${highlightMatch(displayName, query)} <span class="result-type result-type-practice">Pratique</span>`;
            searchResultsContainer.appendChild(item);
        });
    };

    let suggestionDebounceTimer: number;
    const handleInputSuggestions = () => {
        const query = userInput.value.trim().toLowerCase();
        inputSuggestions.innerHTML = '';

        if (query.length < 2) {
            inputSuggestions.style.display = 'none';
            return;
        }

        const matches = uniqueSuggestions.filter(term => term.toLowerCase().includes(query));
        
        const highlightMatch = (text: string, query: string) => {
            const escapedQuery = query.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
            const regex = new RegExp(`(${escapedQuery})`, 'gi');
            return text.replace(regex, '<strong>$1</strong>');
        };

        if (matches.length > 0) {
            matches.slice(0, 5).forEach(match => {
                const item = document.createElement('div');
                item.className = 'suggestion-item';
                item.innerHTML = highlightMatch(match, query);
                item.dataset.value = match;
                inputSuggestions.appendChild(item);
            });
            inputSuggestions.style.display = 'block';
        } else {
            inputSuggestions.style.display = 'none';
        }
    };
    
    const handleFileSelect = (event: Event) => {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];
        if (!file) return;

        appState.stagedFile = file;
        displayFilePreview();
        
        fileInput.value = '';
    };

    const displayFilePreview = () => {
        const file = appState.stagedFile;
        if (!file) return;

        const fileSize = (file.size / 1024).toFixed(1) + ' KB';
        let previewHTML = '';
        
        if (file.type.startsWith('image/')) {
            const objectURL = URL.createObjectURL(file);
            previewHTML = `<img src="${objectURL}" alt="Aperçu">`;
        } else {
            previewHTML = `<span>📎</span>`;
        }

        filePreviewContainer.innerHTML = `
            <div class="file-preview">
                ${previewHTML}
                <div class="file-info">
                    <span class="file-name">${file.name}</span>
                    <span class="file-size">${fileSize}</span>
                </div>
                <button id="remove-file-btn" title="Retirer le fichier">&times;</button>
            </div>`;
        filePreviewContainer.style.display = 'block';

        document.getElementById('remove-file-btn')?.addEventListener('click', clearStagedFile);
    };

    const clearStagedFile = () => {
        appState.stagedFile = null;
        filePreviewContainer.innerHTML = '';
        filePreviewContainer.style.display = 'none';
    };
    
    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    // --- Event Listeners ---
    menuToggle.addEventListener('click', () => {
        document.body.classList.toggle('sidebar-collapsed');
    });

    sendButton.addEventListener('click', handleUserInput);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            inputSuggestions.style.display = 'none';
            handleUserInput();
        }
    });

    attachFileButton.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);

    suggestionButtons.forEach(button => {
        button.addEventListener('click', () => {
            userInput.value = (button as HTMLButtonElement).dataset.value || '';
            handleUserInput();
        });
    });
    
    charButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const char = (button as HTMLButtonElement).dataset.char;
            if (char) insertAtCursor(char);
        });
    });

    sidebarSearch.addEventListener('input', handleSearchInput);
    
    searchResultsContainer.addEventListener('click', (e) => {
        const target = (e.target as HTMLElement).closest('.search-result-item');
        if (!target) return;
        
        const lessonTopic = (target as HTMLElement).dataset.lessonTopic;
        const quizTopic = (target as HTMLElement).dataset.quizTopic;
        const practiceTopic = (target as HTMLElement).dataset.practiceTopic;

        if (lessonTopic) {
            generateLesson(lessonTopic);
        } else if (quizTopic) {
            startQuiz(quizTopic);
        } else if (practiceTopic) {
            startPracticeMode(practiceTopic);
        }


        sidebarSearch.value = '';
        searchResultsContainer.innerHTML = '';
        if (window.innerWidth < 768) {
            document.body.classList.add('sidebar-collapsed');
        }
    });
    
    navChat.addEventListener('click', (e) => {
        e.preventDefault();
        showChatView();
    });

    navHistory.addEventListener('click', (e) => {
        e.preventDefault();
        showHistoryView();
    });
    
    userInput.addEventListener('input', () => {
        clearTimeout(suggestionDebounceTimer);
        suggestionDebounceTimer = setTimeout(handleInputSuggestions, 250);
    });

    inputSuggestions.addEventListener('mousedown', (e) => {
        const target = e.target as HTMLElement;
        if (target.classList.contains('suggestion-item')) {
            const value = target.dataset.value;
            if (value) userInput.value = value;
            handleUserInput();
            inputSuggestions.style.display = 'none';
            userInput.focus();
        }
    });

    userInput.addEventListener('blur', () => {
        setTimeout(() => {
            inputSuggestions.style.display = 'none';
        }, 150);
    });

    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            inputSuggestions.style.display = 'none';
        }
    });

    // --- Initial Message ---
    aiRespond("Bonjour ! Je suis MathIA, ton assistant personnel pour les mathématiques. Comment puis-je t'aider aujourd'hui ? Tu peux maintenant aussi me joindre une photo ou un PDF de ton exercice !", 500);
    updateProgressBar();
});