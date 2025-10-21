
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
    const settingsView = document.getElementById('settings-view') as HTMLDivElement;
    const examView = document.getElementById('exam-view') as HTMLDivElement;
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
    const backToHistoryBtn = document.getElementById('back-to-history-btn') as HTMLLIElement;
    const sidebarSearch = document.getElementById('sidebar-search') as HTMLInputElement;
    const searchResultsContainer = document.getElementById('search-results') as HTMLDivElement;
    const navChat = document.getElementById('nav-chat') as HTMLAnchorElement;
    const navHistory = document.getElementById('nav-history') as HTMLAnchorElement;
    const navSettings = document.getElementById('nav-settings') as HTMLAnchorElement;
    const navExam = document.getElementById('nav-exam') as HTMLAnchorElement;
    const themeToggle = document.getElementById('theme-toggle') as HTMLInputElement;
    const inputSuggestions = document.getElementById('input-suggestions') as HTMLDivElement;
    const progressBarInner = document.getElementById('progress-bar-inner') as HTMLDivElement;
    const progressPercentage = document.getElementById('progress-percentage') as HTMLSpanElement;
    const learningGoalsList = document.getElementById('learning-goals-list') as HTMLUListElement;
    const goalContextMenu = document.getElementById('goal-context-menu') as HTMLDivElement;
    const deleteGoalBtn = document.getElementById('delete-goal-btn') as HTMLLIElement;
    const historyContextMenu = document.getElementById('history-context-menu') as HTMLDivElement;
    const deleteHistoryBtn = document.getElementById('delete-history-btn') as HTMLLIElement;
    const addGoalBtn = document.getElementById('add-goal-btn') as HTMLButtonElement;
    const addGoalFormContainer = document.getElementById('add-goal-form-container') as HTMLDivElement;
    const newGoalInput = document.getElementById('new-goal-input') as HTMLInputElement;
    const saveGoalBtn = document.getElementById('save-goal-btn') as HTMLButtonElement;
    const personalityRadios = document.querySelectorAll('input[name="tutor-personality"]');
    const examHeader = document.getElementById('exam-header') as HTMLDivElement;
    const examTopicDisplay = document.getElementById('exam-topic') as HTMLHeadingElement;
    const examTimerDisplay = document.getElementById('exam-timer') as HTMLSpanElement;
    const examProgressDisplay = document.getElementById('exam-progress') as HTMLSpanElement;


    // --- Application State ---
    const loadLessonHistory = (): any[] => {
        try {
            const savedHistory = localStorage.getItem('lessonHistory');
            if (savedHistory) {
                const parsedHistory = JSON.parse(savedHistory);
                // Ensure all items have a unique ID
                return (Array.isArray(parsedHistory) ? parsedHistory : []).map((item, index) => ({
                    ...item,
                    id: item.id || `history-${Date.now()}-${index}`
                }));
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
            console.error("Failed to load user progress from localStorage", e);
            return new Set();
        }
    };

    const saveUserProgress = () => {
        try {
            localStorage.setItem('userProgress', JSON.stringify(Array.from(appState.userProgress.masteredTopics)));
        } catch (e) {
            console.error("Failed to save user progress to localStorage", e);
        }
    };

    const loadLearningGoals = (): { topic: string; title: string }[] => {
        try {
            const savedGoals = localStorage.getItem('learningGoals');
            if (savedGoals) {
                const parsed = JSON.parse(savedGoals);
                return Array.isArray(parsed) ? parsed : [];
            }
            return [];
        } catch (e) {
            console.error("Failed to load learning goals from localStorage", e);
            return [];
        }
    };

    const saveLearningGoals = () => {
        try {
            localStorage.setItem('learningGoals', JSON.stringify(appState.learningGoals));
        } catch (e) {
            console.error("Failed to save learning goals to localStorage", e);
        }
    };

    const loadTutorPersonality = (): string => {
        return localStorage.getItem('tutorPersonality') || 'pair-amical';
    };

    const saveTutorPersonality = () => {
        localStorage.setItem('tutorPersonality', appState.tutorPersonality);
    };


    let appState = {
        mode: 'idle', // 'idle', 'quiz', 'tutor', 'practice', 'exam'
        lessonHistory: loadLessonHistory(),
        learningGoals: loadLearningGoals(),
        tutorPersonality: loadTutorPersonality(),
        stagedFile: null as File | null,
        currentChat: [] as { sender: 'user' | 'ai'; text: string; attachment?: any }[],
        isViewingHistory: false,
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
        },
        exam: {
            topic: null as string | null,
            questions: [] as any[],
            currentQuestionIndex: 0,
            userAnswers: [] as string[],
            startTime: null as number | null,
            timerId: null as any | null,
            timeLimit: 300, // 5 minutes in seconds
            isFinished: false
        }
    };

    // --- Simulated Database ---
    const knowledgeBase = {
        lessons: {
            "théorème de pythagore": {
                title: "Théorème de Pythagore",
                definition: "Dans un triangle rectangle, le carré de la longueur de l'hypoténuse (le côté opposé à l'angle droit) est égal à la somme des carrés des longueurs des deux autres côtés.",
                formula: "a² + b² = c²",
                example: "Si un triangle rectangle a des côtés de longueurs a=3 et b=4, alors l'hypoténuse c se calcule ainsi : 3² + 4² = 9 + 16 = 25. Donc, c = √25 = 5.",
                usage: "Ce théorème est fondamental en géométrie pour calculer des distances, en architecture pour assurer des angles droits, ou même en navigation."
            },
             "fonctions du second degré": {
                title: "Fonctions du second degré (ou quadratiques)",
                definition: "Une fonction du second degré est une fonction polynomiale de degré 2. Sa représentation graphique est une parabole.",
                formula: "f(x) = ax² + bx + c, avec a ≠ 0",
                example: "Pour f(x) = x² - 2x - 3, la parabole est tournée vers le haut (car a=1 > 0). Les racines (où f(x)=0) sont x=-1 et x=3.",
                usage: "Elles modélisent des trajectoires (lancer de balle), des surfaces, et permettent d'optimiser des problèmes (profit maximal, etc.)."
            }
        },
        quizzes: {
            "fonctions du second degré": [
                { difficulty: 'easy', question: "Pour f(x) = 3x² - 5x + 1, quelle est la valeur de 'a' ?", answer: "3", explanation: "Le coefficient 'a' est le nombre qui multiplie x²." },
                { difficulty: 'medium', question: "Quelle est la forme de la courbe d'une fonction du second degré ?", answer: "parabole", explanation: "La représentation graphique d'une fonction quadratique est toujours une parabole." },
                { difficulty: 'medium', question: "Si le discriminant (Δ) est positif, combien de racines réelles l'équation a-t-elle ?", answer: "2", explanation: "Un discriminant positif (Δ > 0) indique qu'il y a deux solutions réelles distinctes." },
                { difficulty: 'hard', question: "Trouvez le sommet de la parabole f(x) = x² - 4x + 5. Répondez sous la forme (x,y).", answer: "(2,1)", explanation: "L'abscisse du sommet est (-b/2a), soit (-(-4)/(2 × 1) = 2). L'ordonnée est f(2) = 2² - 4(2) + 5 = 1." },
                { difficulty: 'hard', question: "Factorisez x² - 5x + 6.", answer: "(x-2)(x-3)", explanation: "On cherche deux nombres dont la somme est 5 et le produit est 6. Ces nombres sont 2 et 3." }
            ],
             "théorème de pythagore": [
                { difficulty: 'easy', question: "Le théorème de Pythagore s'applique à quel type de triangle ?", answer: "rectangle", explanation: "Le théorème ne s'applique qu'aux triangles rectangles." },
                { difficulty: 'medium', question: "Si a=6 et b=8, que vaut c (l'hypoténuse) ?", answer: "10", explanation: "6² + 8² = 36 + 64 = 100. La racine carrée de 100 est 10." },
                { difficulty: 'medium', question: "Le plus long côté d'un triangle rectangle s'appelle...", answer: "hypoténuse", explanation: "L'hypoténuse est toujours le côté opposé à l'angle droit et le plus long." },
                { difficulty: 'hard', question: "Un écran 16:9 a une diagonale de 20 pouces. Quelle est approximativement sa largeur ? (Répondez avec un entier)", answer: "17", explanation: "On résout (16x)² + (9x)² = 20² ⇒ 337x² = 400 ⇒ x ≈ 1.09. Largeur = 16x ≈ 17.4." },
                { difficulty: 'hard', question: "Un triangle avec des côtés de 5, 12 et 13 est-il rectangle ?", answer: "oui", explanation: "Oui, car 5² + 12² = 25 + 144 = 169, et 13² = 169. L'égalité a²+b²=c² est vérifiée." }
            ]
        },
        practiceExercises: {
            "théorème de pythagore": [
                { problem: "Un triangle rectangle a un côté de 5 cm et un autre de 12 cm. Quelle est la longueur de l'hypoténuse ?" },
                { problem: "La diagonale d'un carré mesure 10 cm. Quelle est la longueur d'un côté ? (arrondir à deux décimales)" },
                { problem: "Une échelle de 5m est appuyée contre un mur. Son pied est à 3m du mur. À quelle hauteur sur le mur l'échelle arrive-t-elle ?" }
            ],
            "fonctions du second degré": [
                { problem: "Trouvez les racines de l'équation x² - 7x + 10 = 0." },
                { problem: "Quel est le sommet de la parabole définie par f(x) = -2x² + 8x - 5 ?" },
                { problem: "Factorisez l'expression 2x² + 5x - 3." }
            ]
        },
        interactiveExercises: {
            "théorème de pythagore": [
                {
                    type: 'multiple-choice',
                    question: "Dans un triangle rectangle, le côté le plus long s'appelle...",
                    options: ["L'hypoténuse", "La cathète", "La médiane"],
                    answer: "L'hypoténuse",
                    explanation: "L'hypoténuse est toujours opposée à l'angle droit et est le côté le plus long."
                },
                {
                    type: 'calculation',
                    question: "Si a=3 et b=4, que vaut c (l'hypoténuse) ?",
                    answer: "5",
                    explanation: "D'après le théorème, c² = a² + b² = 3² + 4² = 9 + 16 = 25. Donc, c = √25 = 5."
                }
            ],
            "fonctions du second degré": [
                 {
                    type: 'fill-in-the-blank',
                    question: "La représentation graphique d'une fonction du second degré est une ___.",
                    answer: "parabole",
                    explanation: "Les fonctions quadratiques, de la forme f(x) = ax² + bx + c, ont toujours une parabole comme courbe représentative."
                },
                {
                    type: 'multiple-choice',
                    question: "Si le coefficient 'a' de f(x) = ax² + bx + c est positif, la parabole est tournée vers...",
                    options: ["Le haut", "Le bas", "La gauche"],
                    answer: "Le haut",
                    explanation: "Un 'a' positif signifie que la parabole s'ouvre vers le haut (elle 'sourit')."
                }
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
        "Je veux passer un examen"
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

    const getSystemInstruction = (mode: 'lesson' | 'tutor' | 'practice'): string => {
        const personalityInstructions = {
            'professeur-formel': "Ton rôle est celui d'un professeur de mathématiques formel. Ton approche est académique, précise et structurée. Utilise un langage soutenu et des explications détaillées. Guide l'élève avec rigueur et logique.",
            'pair-amical': "Ton rôle est celui d'un pair bienveillant et amical. Adresse-toi à l'élève simplement, utilise des analogies et des encouragements. Ton but est de dédramatiser les maths et de rendre l'apprentissage collaboratif.",
            'coach-encourageant': "Ton rôle est celui d'un coach dynamique et motivant. Ton ton est positif et plein d'énergie. Célèbre les petites victoires, encourage l'élève à persévérer et utilise des métaphores pour booster sa confiance."
        };
        
        const symbolRule = "\n\n**Règle sur les symboles (TRÈS IMPORTANT) :** N'utilise JAMAIS de code de formatage comme le LaTeX (par exemple `\\le`, `\\ge`). Utilise directement les caractères universels (Unicode) comme `≤`, `≥`, `≠`, `×`, `÷`, `√`.";
    
        const personalityPrefix = personalityInstructions[appState.tutorPersonality as keyof typeof personalityInstructions] || personalityInstructions['pair-amical'];
    
        switch (mode) {
            case 'tutor':
                return `Tu es MathIA, un tuteur de mathématiques. ${personalityPrefix} Ton but est de guider les élèves vers la solution sans la leur donner. Utilise la méthode socratique, en posant des questions pour stimuler leur réflexion.` + symbolRule;
            case 'practice':
                return `Tu es MathIA, un tuteur de maths qui évalue les réponses des exercices. ${personalityPrefix} Sois positif et guide l'élève.` + symbolRule;
            case 'lesson':
                return `Tu es MathIA, un tuteur en mathématiques expert, pédagogue et très clair. ${personalityPrefix}

Ta mission est de fournir des leçons complètes sur le sujet demandé par l'utilisateur. Chaque réponse que tu fournis DOIT suivre impérativement le guide de style suivant pour garantir une lisibilité et un rendu parfaits dans l'application.

### GUIDE DE STYLE HTML OBLIGATOIRE ###

1.  **Structure Générale :**
    *   Commence toujours par un titre principal clair et pertinent, en utilisant une balise \`<h2>\` (ex: \`<h2>Leçon Complète sur les Inéquations</h2>\`).
    *   Divise la leçon en sections logiques avec des sous-titres, en utilisant des balises \`<h3>\` (ex: \`<h3>1. Qu'est-ce qu'une inéquation ?</h3>\`).

2.  **Mise en Forme du Texte :**
    *   **Termes Clés :** Mets les définitions et les mots importants en gras avec la balise \`<strong>\` (ex: \`une <strong>inéquation</strong> est une relation d'<strong>inégalité</strong>...\`).
    *   **Listes :** Utilise des listes à puces (\`<ul>\` et \`<li>\`) pour énumérer des points, comme les différents symboles ou les étapes d'une méthode.
    *   **Expressions Mathématiques :** Utilise directement les caractères Unicode pour les symboles mathématiques (ex: \`√\`, \`≤\`, \`≥\`). N'utilise pas la syntaxe LaTeX comme \`\\( ... \\)\`.

3.  **Aération et Lisibilité (LE PLUS IMPORTANT) :**
    *   Rédige des paragraphes courts (2-3 phrases maximum) et encadre chaque paragraphe dans une balise \`<p>\`.
    *   Utilise des exemples concrets pour chaque concept expliqué.

En suivant STRICTEMENT ce guide de style, donne-moi une leçon complète sur le sujet demandé par l'utilisateur.` + symbolRule;
            default:
                return `Tu es MathIA, un tuteur de mathématiques. ${personalityPrefix}` + symbolRule;
        }
    };
    
    const updateProgressBar = () => {
        const totalTopics = Object.keys(knowledgeBase.quizzes).length;
        const masteredTopicsCount = appState.userProgress.masteredTopics.size;
        
        if (totalTopics === 0) return;

        const percentage = Math.round((masteredTopicsCount / totalTopics) * 100);
        
        progressBarInner.style.width = `${percentage}%`;
        progressPercentage.textContent = `${percentage}% Maîtrisé`;
    };

    const renderLearningGoals = () => {
        learningGoalsList.innerHTML = '';
        if (appState.learningGoals.length === 0) {
            learningGoalsList.innerHTML = `<li class="no-goals">Aucun objectif défini.</li>`;
            return;
        }

        appState.learningGoals.forEach(goal => {
            const isCompleted = appState.userProgress.masteredTopics.has(goal.topic);
            const li = document.createElement('li');
            li.className = `goal-item ${isCompleted ? 'completed' : ''}`;
            li.dataset.topic = goal.topic;
            li.title = `Travailler sur : ${goal.title}`;
            
            const icon = isCompleted ? '✅' : '🎯';
            li.innerHTML = `<span class="icon">${icon}</span> <span>${goal.title}</span>`;
            learningGoalsList.appendChild(li);
        });
    };

    const setLearningGoal = (topic: string) => {
        if (appState.learningGoals.some(goal => goal.topic === topic)) {
            addMessage("Cet objectif est déjà dans votre liste.", 'ai');
            return;
        }

        const lesson = knowledgeBase.lessons[topic as keyof typeof knowledgeBase.lessons];
        if (lesson) {
            appState.learningGoals.push({ topic, title: lesson.title });
            saveLearningGoals();
            renderLearningGoals();
            addMessage(`Super ! J'ai ajouté "<strong>${lesson.title}</strong>" à tes objectifs d'apprentissage.`, 'ai');
        }
    };
    
    const addCustomLearningGoal = (title: string) => {
        const normalizedTitle = title.trim();
        if (!normalizedTitle) return;

        if (appState.learningGoals.some(goal => goal.title.toLowerCase() === normalizedTitle.toLowerCase())) {
            // Silently ignore or show a small visual cue instead of a chat message
            newGoalInput.style.borderColor = 'red';
            setTimeout(() => { newGoalInput.style.borderColor = '' }, 1000);
            return;
        }

        // Create a unique topic key from the title to avoid collisions
        const topicKey = `custom-${normalizedTitle.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
        
        appState.learningGoals.push({ topic: topicKey, title: normalizedTitle });
        saveLearningGoals();
        renderLearningGoals();
        // Optional: confirm with a chat message if the chat view is active
        // addMessage(`J'ai ajouté "<strong>${normalizedTitle}</strong>" à tes objectifs. Clique dessus pour commencer !`, 'ai');
    };

    const deleteLearningGoal = (topic: string) => {
        appState.learningGoals = appState.learningGoals.filter(goal => goal.topic !== topic);
        saveLearningGoals();
        renderLearningGoals();
        // Optional: add a confirmation message in the chat
        // addMessage(`L'objectif a été supprimé.`, 'ai');
    };
    
    const deleteHistoryItem = (id: string) => {
        appState.lessonHistory = appState.lessonHistory.filter(item => item.id !== id);
        saveLessonHistory();
        showHistoryView(); // Re-render the view
    };

    const saveCurrentChatIfNeeded = async () => {
        // Only save if the chat is not empty and is a "new" chat, not a historical one.
        if (appState.currentChat.length > 1 && !appState.isViewingHistory) { // > 1 to avoid saving empty chats with only the greeting
            const typingIndicator = showTypingIndicator();
            try {
                const chatHistoryText = appState.currentChat.map(m => `${m.sender}: ${m.text}`).join('\n');
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: `Résume cette conversation en 5 mots maximum pour en faire un titre : \n\n${chatHistoryText}`,
                });

                const title = response.text.trim().replace(/^"|"$/g, ''); // Remove quotes
                if (title) {
                     appState.lessonHistory.push({
                        id: `chat-${Date.now()}`,
                        type: 'chat',
                        title: title,
                        content: [...appState.currentChat]
                    });
                    saveLessonHistory();
                }
            } catch (error) {
                console.error("Error generating title for chat:", error);
                 appState.lessonHistory.push({
                    id: `chat-${Date.now()}`,
                    type: 'chat',
                    title: "Conversation sauvegardée",
                    content: [...appState.currentChat]
                });
                saveLessonHistory();
            } finally {
                 hideTypingIndicator(typingIndicator);
            }
        }
    };
    
    const switchToChatView = () => {
        historyView.style.display = 'none';
        settingsView.style.display = 'none';
        examView.style.display = 'none';
        chatWindow.style.display = 'flex';
        inputWrapper.style.display = 'block';
        document.querySelector('#sidebar nav a.active')?.classList.remove('active');
        navChat.classList.add('active');
    };

    const showChatView = async () => {
        await saveCurrentChatIfNeeded();

        appState.isViewingHistory = false;
        switchToChatView();
        backToHistoryBtn.style.display = 'none';

        appState.currentChat = [];
        chatWindow.innerHTML = '';
        addMessage("Bonjour ! Je suis MathIA. Comment puis-je t'aider avec les mathématiques aujourd'hui ?", 'ai');
    };

    const showHistoryView = () => {
        chatWindow.style.display = 'none';
        settingsView.style.display = 'none';
        examView.style.display = 'none';
        examHeader.style.display = 'none';
        inputWrapper.style.display = 'none';
        historyView.style.display = 'block';
        backToHistoryBtn.style.display = 'none';
    
        document.querySelector('#sidebar nav a.active')?.classList.remove('active');
        navHistory.classList.add('active');
    
        historyView.innerHTML = `<h2>Historique</h2>`;
        if (appState.lessonHistory.length === 0) {
            historyView.innerHTML += `<p class="empty-history">Votre historique est vide.</p>`;
        } else {
            const ul = document.createElement('ul');
            appState.lessonHistory.slice().reverse().forEach((item: any) => {
                const li = document.createElement('li');
                const historyId = item.id || `topic-${item.topic}`; // Fallback for old data without id
                if (item.type === 'chat') {
                    li.innerHTML = `<a href="#" data-history-id="${historyId}" data-chat-id="${item.id}" class="history-item">
                                        <span class="history-icon">💬</span> ${item.title}
                                    </a>`;
                } else {
                    li.innerHTML = `<a href="#" data-history-id="${historyId}" data-topic="${item.topic}" class="history-item">
                                        <span class="history-icon">📖</span> ${item.title}
                                    </a>`;
                }
                ul.appendChild(li);
            });
            historyView.appendChild(ul);
        }
    };

    const showSettingsView = () => {
        chatWindow.style.display = 'none';
        historyView.style.display = 'none';
        examView.style.display = 'none';
        examHeader.style.display = 'none';
        inputWrapper.style.display = 'none';
        settingsView.style.display = 'block';
        backToHistoryBtn.style.display = 'none';

        document.querySelector('#sidebar nav a.active')?.classList.remove('active');
        navSettings.classList.add('active');
    };
    
    const showExamView = () => {
        chatWindow.style.display = 'none';
        historyView.style.display = 'none';
        settingsView.style.display = 'none';
        examHeader.style.display = 'none';
        inputWrapper.style.display = 'none';
        examView.style.display = 'block';
        backToHistoryBtn.style.display = 'none';

        document.querySelector('#sidebar nav a.active')?.classList.remove('active');
        navExam.classList.add('active');

        examView.innerHTML = `<h2>Choisissez un sujet d'examen</h2>`;
        const topics = Object.keys(knowledgeBase.quizzes);
        if (topics.length === 0) {
            examView.innerHTML += `<p>Aucun sujet d'examen disponible pour le moment.</p>`;
        } else {
            const ul = document.createElement('ul');
            ul.id = 'exam-topic-list';
            topics.forEach(topic => {
                const lessonTitle = knowledgeBase.lessons[topic as keyof typeof knowledgeBase.lessons]?.title || topic;
                const li = document.createElement('li');
                li.innerHTML = `<a href="#" class="exam-topic-item" data-topic="${topic}">${lessonTitle}</a>`;
                ul.appendChild(li);
            });
            examView.appendChild(ul);
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
        if (sender !== 'user' || appState.mode !== 'exam') {
            appState.currentChat.push({ sender, text, attachment });
        }
        
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

        const interactiveModule = content.querySelector('[data-interactive-module]');
        if (interactiveModule && interactiveModule instanceof HTMLElement) {
            const moduleType = interactiveModule.dataset.interactiveModule;
            if (moduleType === 'pythagore') {
                initPythagorasInteractive(interactiveModule);
            } else if (moduleType === 'parabole') {
                initParabolaInteractive(interactiveModule);
            }
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
                    systemInstruction: getSystemInstruction('tutor'),
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
        addMessage(query, 'user');

        if (file) {
            const attachment = {
                name: file.name,
                type: file.type,
                previewUrl: URL.createObjectURL(file)
            };
            // The user message is already added above, just need to update it visually.
            // This is complex, so for now we'll accept the message appearing without the preview first.
            clearStagedFile();

            const typingIndicator = showTypingIndicator();
            const aiResponse = await getTutorResponse(query, file);
            hideTypingIndicator(typingIndicator);
            addMessage(aiResponse, 'ai');

            appState.mode = 'tutor';
            return;
        }

        if (appState.mode === 'quiz') {
            processQuizAnswer(query);
            return;
        }
        
        if (appState.mode === 'exam') {
            processExamAnswer(query);
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
        } else if (lowerCaseQuery.includes('examen')) {
            const topic = findTopic(lowerCaseQuery, Object.keys(knowledgeBase.quizzes));
            if (topic) {
                startExam(topic);
            } else {
                addMessage("Parfait ! Sur quel sujet veux-tu passer un examen ?", 'ai');
                showExamView();
            }
        } else if (lowerCaseQuery.includes('pratiquer') || lowerCaseQuery.includes('entraînement') || lowerCaseQuery.includes('exercices sur')) {
            const topic = findTopic(lowerCaseQuery, Object.keys(knowledgeBase.practiceExercises));
            if (topic) startPracticeMode(topic);
            else aiRespond("Super ! Sur quel sujet veux-tu t'entraîner ? Par exemple : fonctions du second degré.");
        } else if (lowerCaseQuery.includes('exercice') || lowerCaseQuery.includes('aide')) {
            startTutorSession();
        } else {
             const topic = findTopic(lowerCaseQuery, [...Object.keys(knowledgeBase.lessons), ...Object.keys(knowledgeBase.quizzes)]);
             if(topic) generateLesson(topic);
             else {
                 const typingIndicator = showTypingIndicator();
                 try {
                     const response = await ai.models.generateContent({
                        model: 'gemini-2.5-flash',
                        contents: query,
                        config: {
                           systemInstruction: getSystemInstruction('lesson'),
                        }
                     });
                     hideTypingIndicator(typingIndicator);
                     addMessage(response.text, 'ai');
                 } catch (error) {
                     console.error("Error calling Gemini API:", error);
                     hideTypingIndicator(typingIndicator);
                     addMessage("Désolé, je n'ai pas pu traiter ta demande. Peux-tu reformuler ?", 'ai');
                 }
             }
        }
    };
    
    const findTopic = (query: string, availableTopics: string[]): string | null => {
        const lowerQuery = query.toLowerCase();
        for (const topic of availableTopics) {
            if (lowerQuery.includes(topic)) {
                return topic;
            }
        }
        return null;
    };
    
    const startTutorSession = () => {
        appState.mode = 'tutor';
        addMessage("Bien sûr ! Montre-moi une photo de ton exercice ou décris-le moi. Je vais te guider.", 'ai');
    };

    const getPythagorasInteractiveHTML = (): string => {
        return `
        <div class="interactive-diagram" data-interactive-module="pythagore">
          <div class="lesson-diagram">
              <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
                <polygon id="pythagoras-triangle" points="10,110 50,110 10,70" fill="#f0f6ff" stroke="#4a90e2" stroke-width="2"/>
                <text id="pythagoras-label-a" x="25" y="118" font-family="inherit" font-size="10px" fill="var(--text-color-dark)">a=4</text>
                <text id="pythagoras-label-b" x="2" y="90" font-family="inherit" font-size="10px" fill="var(--text-color-dark)">b=4</text>
                <text id="pythagoras-label-c" x="25" y="85" font-family="inherit" font-size="10px" fill="var(--text-color-dark)" transform="rotate(-45 30 80)">c=5.66</text>
              </svg>
          </div>
          <div class="formula-display" id="pythagoras-formula">4² + 4² = 5.66²</div>
          <div class="interactive-controls">
            <div class="control-group">
              <label>Côté a: <span class="value-display" id="pythagoras-value-a">4</span></label>
              <input type="range" id="pythagoras-slider-a" min="1" max="10" value="4" step="0.5">
            </div>
            <div class="control-group">
              <label>Côté b: <span class="value-display" id="pythagoras-value-b">4</span></label>
              <input type="range" id="pythagoras-slider-b" min="1" max="10" value="4" step="0.5">
            </div>
          </div>
        </div>`;
    };

    const getParabolaInteractiveHTML = (): string => {
        return `
        <div class="interactive-diagram" data-interactive-module="parabole">
          <div class="lesson-diagram">
              <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
                <line x1="10" y1="60" x2="110" y2="60" stroke="#aaa" stroke-width="1"/>
                <line x1="60" y1="10" x2="60" y2="110" stroke="#aaa" stroke-width="1"/>
                <polygon points="110,60 105,57 105,63" fill="#aaa"/>
                <polygon points="60,10 57,15 63,15" fill="#aaa"/>
                <text x="108" y="55" font-size="8px" fill="var(--text-color-dark)">x</text>
                <text x="65" y="15" font-size="8px" fill="var(--text-color-dark)">y</text>
                <path id="parabola-path" d="M 10 110 Q 60 10, 110 110" stroke="#4a90e2" stroke-width="2.5" fill="none"/>
              </svg>
          </div>
          <div class="formula-display" id="parabola-formula">f(x) = 1.0x² + 0.0x + 0.0</div>
          <div class="interactive-controls">
            <div class="control-group">
              <label>a: <span class="value-display" id="parabola-value-a">1.0</span></label>
              <input type="range" id="parabola-slider-a" min="-2" max="2" value="1" step="0.1">
            </div>
            <div class="control-group">
              <label>b: <span class="value-display" id="parabola-value-b">0.0</span></label>
              <input type="range" id="parabola-slider-b" min="-5" max="5" value="0" step="0.25">
            </div>
            <div class="control-group">
              <label>c: <span class="value-display" id="parabola-value-c">0.0</span></label>
              <input type="range" id="parabola-slider-c" min="-10" max="10" value="0" step="0.5">
            </div>
          </div>
        </div>`;
    };
    
    const initPythagorasInteractive = (container: HTMLElement) => {
        const sliderA = container.querySelector('#pythagoras-slider-a') as HTMLInputElement;
        const sliderB = container.querySelector('#pythagoras-slider-b') as HTMLInputElement;
        const valueA = container.querySelector('#pythagoras-value-a') as HTMLSpanElement;
        const valueB = container.querySelector('#pythagoras-value-b') as HTMLSpanElement;
        const triangle = container.querySelector('#pythagoras-triangle') as SVGPolygonElement;
        const labelA = container.querySelector('#pythagoras-label-a') as SVGTextElement;
        const labelB = container.querySelector('#pythagoras-label-b') as SVGTextElement;
        const labelC = container.querySelector('#pythagoras-label-c') as SVGTextElement;
        const formulaDisplay = container.querySelector('#pythagoras-formula') as HTMLDivElement;
    
        if (!sliderA || !triangle) return; // Element not found, exit
    
        const update = () => {
            const a = parseFloat(sliderA.value);
            const b = parseFloat(sliderB.value);
            const c = Math.sqrt(a * a + b * b);
    
            valueA.textContent = a.toString();
            valueB.textContent = b.toString();
            
            const scale = 10;
            const p1 = { x: 10, y: 110 };
            const p2 = { x: 10 + a * scale, y: 110 };
            const p3 = { x: 10, y: 110 - b * scale };
    
            triangle.setAttribute('points', `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`);
    
            labelA.textContent = `a=${a}`;
            labelA.setAttribute('x', `${p1.x + (a * scale) / 2 - 5}`);
            labelA.setAttribute('y', `${p1.y + 8}`);
    
            labelB.textContent = `b=${b}`;
            labelB.setAttribute('x', `${p1.x - 8}`);
            labelB.setAttribute('y', `${p1.y - (b * scale) / 2 + 5}`);
    
            const cFormatted = c.toFixed(2);
            labelC.textContent = `c=${cFormatted}`;
            const cLabelX = (p2.x + p3.x) / 2;
            const cLabelY = (p2.y + p3.y) / 2;
            const angle = -Math.atan(b/a) * (180/Math.PI);
            labelC.setAttribute('transform', `translate(${cLabelX}, ${cLabelY}) rotate(${angle}) translate(10, -5)`);
    
            formulaDisplay.textContent = `${a}² + ${b}² = ${cFormatted}²`;
        };
        
        sliderA.addEventListener('input', update);
        sliderB.addEventListener('input', update);
        update();
    };

    const initParabolaInteractive = (container: HTMLElement) => {
        const sliderA = container.querySelector('#parabola-slider-a') as HTMLInputElement;
        const sliderB = container.querySelector('#parabola-slider-b') as HTMLInputElement;
        const sliderC = container.querySelector('#parabola-slider-c') as HTMLInputElement;
        const valueA = container.querySelector('#parabola-value-a') as HTMLSpanElement;
        const valueB = container.querySelector('#parabola-value-b') as HTMLSpanElement;
        const valueC = container.querySelector('#parabola-value-c') as HTMLSpanElement;
        const path = container.querySelector('#parabola-path') as SVGPathElement;
        const formulaDisplay = container.querySelector('#parabola-formula') as HTMLDivElement;
        
        if (!sliderA || !path) return;
    
        const update = () => {
            const a = parseFloat(sliderA.value);
            const b = parseFloat(sliderB.value);
            const c = parseFloat(sliderC.value);
    
            valueA.textContent = a.toFixed(1);
            valueB.textContent = b.toFixed(1);
            valueC.textContent = c.toFixed(1);
    
            const viewboxWidth = 120;
            const viewboxHeight = 120;
            const originX = viewboxWidth / 2; // SVG x for math x=0
            const originY = viewboxHeight / 2; // SVG y for math y=0
            const scale = 5;
    
            const pathPoints = [];
            const xMin = -12;
            const xMax = 12;
    
            for (let mathX = xMin; mathX <= xMax; mathX += 0.2) {
                 // If a is very close to 0, it's a line
                const mathY = (Math.abs(a) < 0.05) 
                    ? b * mathX + c 
                    : a * mathX * mathX + b * mathX + c;
    
                const svgX = originX + mathX * scale;
                const svgY = originY - mathY * scale;
                
                // clip to viewbox
                if (svgY > 5 && svgY < viewboxHeight - 5) {
                    pathPoints.push([svgX.toFixed(2), svgY.toFixed(2)]);
                }
            }
    
            if (pathPoints.length > 1) {
                 const pathData = 'M ' + pathPoints.map(p => p.join(' ')).join(' L ');
                 path.setAttribute('d', pathData);
            } else {
                 path.setAttribute('d', ''); // Clear path if out of view
            }
            
            const bSign = b >= 0 ? '+' : '-';
            const cSign = c >= 0 ? '+' : '-';
            formulaDisplay.textContent = `f(x) = ${a.toFixed(1)}x² ${bSign} ${Math.abs(b).toFixed(1)}x ${cSign} ${Math.abs(c).toFixed(1)}`;
        };
    
        sliderA.addEventListener('input', update);
        sliderB.addEventListener('input', update);
        sliderC.addEventListener('input', update);
        update();
    };

    const generateLesson = (topic: string) => {
        const lesson = knowledgeBase.lessons[topic as keyof typeof knowledgeBase.lessons];
        if (!lesson) {
            addMessage(`Désolé, je n'ai pas de leçon sur "${topic}".`, 'ai');
            return;
        }

        const isNewLesson = !appState.lessonHistory.some(item => item.topic === topic && item.type !== 'chat');
        if (isNewLesson) {
            appState.lessonHistory.push({
                id: `topic-${topic}`,
                topic: topic, 
                title: lesson.title,
                type: 'lesson'
            });
            saveLessonHistory();
        }

        const isGoalSet = appState.learningGoals.some(g => g.topic === topic);
        const goalButtonHTML = `<button class="goal-btn" data-topic="${topic}" ${isGoalSet ? 'disabled' : ''}>${isGoalSet ? '✅ Objectif Ajouté' : '🎯 Définir comme objectif'}</button>`;
        
        let interactiveHTML = '';
        if (topic === "théorème de pythagore") {
            interactiveHTML = getPythagorasInteractiveHTML();
        } else if (topic === "fonctions du second degré") {
            interactiveHTML = getParabolaInteractiveHTML();
        }

        const interactiveExercisesHTML = generateInteractiveExercises(topic);

        const lessonHTML = `
            <h2>${lesson.title}</h2>
            ${interactiveHTML}
            <p><strong>Définition :</strong> ${lesson.definition}</p>
            <p><strong>Formule :</strong> ${lesson.formula}</p>
            <p><strong>Exemple :</strong> ${lesson.example}</p>
            <p><strong>Utilisation :</strong> ${lesson.usage}</p>
            <div class="lesson-actions">${goalButtonHTML}</div>
            ${interactiveExercisesHTML}
        `;
        addMessage(lessonHTML, 'ai');
        appState.mode = 'idle';
    };

    const renderGeneratedModule = (module: any) => {
        let html = `<div class="generated-module-container">`;
        html += `<h2>${module.titre_module}</h2>`;
    
        // Leçons
        if (module.lecons && module.lecons.length > 0) {
            html += `<div class="module-section"><h3>📚 Leçons Clés</h3>`;
            module.lecons.forEach((lecon: any) => {
                html += `<div class="module-lesson">
                            <h4>${lecon.titre}</h4>
                            <p>${lecon.contenu}</p>
                         </div>`;
            });
            html += `</div>`;
        }
    
        // Quiz
        if (module.quiz && module.quiz.length > 0) {
            html += `<div class="module-section"><h3>🤔 Quiz de Vérification</h3>`;
            module.quiz.forEach((q: any, index: number) => {
                html += `<div class="module-quiz-question">
                            <p><strong>Question ${index + 1}:</strong> ${q.question}</p>
                            <ul class="quiz-options">
                                ${q.options.map((opt: string) => `<li>${opt}</li>`).join('')}
                            </ul>
                            <details><summary>Voir la réponse</summary><p><strong>Réponse :</strong> ${q.reponse_correcte}</p></details>
                         </div>`;
            });
            html += `</div>`;
        }
    
        // Exercices
        if (module.exercices && module.exercices.length > 0) {
            html += `<div class="module-section"><h3>✏️ Exercices Pratiques</h3>`;
            module.exercices.forEach((ex: any) => {
                html += `<div class="module-exercise">
                            <h4>${ex.titre}</h4>
                            <p>${ex.enonce}</p>
                         </div>`;
            });
            html += `</div>`;
        }
    
        html += `</div>`;
        addMessage(html, 'ai');
    };

    const generateModuleFromGoal = async (goalTitle: string) => {
        await showChatView();
        addMessage(`Parfait ! Je prépare un mini-module d'apprentissage sur "<strong>${goalTitle}</strong>" pour toi...`, 'ai');
        const typingIndicator = showTypingIndicator();

        const generationPrompt = `
        Tu es un concepteur pédagogique expert en mathématiques et un assistant d'apprentissage intelligent intégré dans l'application "MathIA".
        Ta mission est de prendre l'objectif d'apprentissage brut fourni par un utilisateur et de le transformer instantanément en un mini-module d'apprentissage structuré. Le module doit être clair, concis et adapté à un débutant sur le sujet.
        Voici l'objectif que l'utilisateur vient d'ajouter depuis la section "Mes Objectifs" :
        "${goalTitle}"
        Analyse cet objectif et génère le contenu suivant :
        1. Leçons Clés : Génère 2 à 3 leçons courtes et synthétiques qui couvrent les concepts mathématiques fondamentaux de l'objectif. Chaque leçon doit avoir un titre et un contenu explicatif simple avec des exemples clairs.
        2. Quiz de Vérification : Crée un quiz de 4 questions à choix multiples pour tester la compréhension des leçons. Chaque question doit avoir 4 options de réponse et une seule réponse correcte.
        3. Exercices Pratiques : Propose 2 exercices ou problèmes qui permettent à l'utilisateur de mettre en pratique les concepts appris. Chaque exercice doit avoir un énoncé clair.
        Le résultat final DOIT impérativement être un objet JSON unique, sans aucun texte avant ou après, afin que l'application "MathAI" puisse l'interpréter directement.
        Voici la structure exacte du JSON attendu :
        {
          "objectif_initial": "Le texte de l'objectif de l'utilisateur",
          "module_apprentissage": {
            "titre_module": "Un titre de module pertinent généré à partir de l'objectif",
            "lecons": [
              { "titre": "Titre de la leçon 1", "contenu": "Contenu explicatif de la leçon 1." },
              { "titre": "Titre de la leçon 2", "contenu": "Contenu explicatif de la leçon 2." }
            ],
            "quiz": [
              { "question": "Texte de la question 1 ?", "options": ["Option A", "Option B", "Option C", "Option D"], "reponse_correcte": "La bonne réponse textuelle ici" }
            ],
            "exercices": [
              { "titre": "Exercice 1 : Mise en pratique", "enonce": "Énoncé clair de l'exercice 1." }
            ]
          }
        }`;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: generationPrompt,
                config: {
                    responseMimeType: "application/json",
                },
            });

            hideTypingIndicator(typingIndicator);
            let jsonText = response.text;
            jsonText = jsonText.replace(/^```json\s*|```$/g, '').trim();

            const moduleData = JSON.parse(jsonText);
            if (moduleData && moduleData.module_apprentissage) {
                renderGeneratedModule(moduleData.module_apprentissage);
            } else {
                 throw new Error("Format JSON invalide reçu de l'API.");
            }

        } catch (error) {
            console.error("Erreur lors de la génération du module d'apprentissage:", error);
            hideTypingIndicator(typingIndicator);
            addMessage("Désolé, une erreur est survenue lors de la création de ton module d'apprentissage. Pourrais-tu réessayer ?", 'ai');
        }
    };


    const generateInteractiveExercises = (topic: string): string => {
        const exercises = knowledgeBase.interactiveExercises[topic as keyof typeof knowledgeBase.interactiveExercises];
        if (!exercises || exercises.length === 0) {
            return '';
        }

        let exercisesHTML = '<div class="interactive-exercise-container"><h3>Exercices Interactifs</h3>';
        
        exercises.forEach((exercise, index) => {
            let inputAreaHTML = '';
            switch (exercise.type) {
                case 'multiple-choice':
                    inputAreaHTML = exercise.options.map(option =>
                        `<button class="exercise-option-btn" data-answer="${option}">${option}</button>`
                    ).join('');
                    break;
                case 'fill-in-the-blank':
                    inputAreaHTML = `<input type="text" class="exercise-text-input" placeholder="Votre réponse...">
                                     <button class="exercise-submit-btn">Valider</button>`;
                    break;
                case 'calculation':
                    inputAreaHTML = `<input type="text" class="exercise-text-input" placeholder="Entrez le calcul ou la réponse">
                                     <button class="exercise-submit-btn">Valider</button>`;
                    break;
            }

            exercisesHTML += `
                <div class="interactive-exercise" data-topic="${topic}" data-exercise-index="${index}" data-type="${exercise.type}">
                    <p class="exercise-question">${index + 1}. ${exercise.question}</p>
                    <div class="exercise-input-area">${inputAreaHTML}</div>
                    <div class="exercise-feedback"></div>
                </div>
            `;
        });

        exercisesHTML += '</div>';
        return exercisesHTML;
    };
    
    const handleInteractiveExercise = (exerciseEl: HTMLElement, userAnswer: string) => {
        if (!exerciseEl.dataset.topic || !exerciseEl.dataset.exerciseIndex) return;

        const topic = exerciseEl.dataset.topic;
        const index = parseInt(exerciseEl.dataset.exerciseIndex, 10);
        const exercise = knowledgeBase.interactiveExercises[topic as keyof typeof knowledgeBase.interactiveExercises][index];
        const feedbackEl = exerciseEl.querySelector('.exercise-feedback') as HTMLDivElement;
        const inputAreaEl = exerciseEl.querySelector('.exercise-input-area') as HTMLDivElement;

        const isCorrect = userAnswer.trim().toLowerCase() === exercise.answer.toLowerCase();

        // Disable all inputs after an answer is given
        inputAreaEl.querySelectorAll('button, input').forEach(el => (el as HTMLButtonElement | HTMLInputElement).disabled = true);
        
        let feedbackHTML = '';
        if (isCorrect) {
            feedbackHTML = `<span class="correct">Correct !</span> ${exercise.explanation}`;
            feedbackEl.classList.add('correct');
            feedbackEl.classList.remove('incorrect');
        } else {
            feedbackHTML = `<span class="incorrect">Incorrect.</span> La bonne réponse est <strong>${exercise.answer}</strong>. ${exercise.explanation}`;
            feedbackEl.classList.add('incorrect');
            feedbackEl.classList.remove('correct');
        }
        
        feedbackEl.innerHTML = feedbackHTML;

        // Visual feedback for multiple choice
        if (exercise.type === 'multiple-choice') {
            inputAreaEl.querySelectorAll('.exercise-option-btn').forEach(btn => {
                const button = btn as HTMLButtonElement;
                if (button.dataset.answer?.toLowerCase() === exercise.answer.toLowerCase()) {
                    button.classList.add('correct-answer');
                } else if (button.dataset.answer?.toLowerCase() === userAnswer.toLowerCase()) {
                    button.classList.add('incorrect-answer');
                }
            });
        }
    };


    const startQuiz = (topic: string) => {
        appState.mode = 'quiz';
        appState.quiz.topic = topic;
        appState.quiz.questionIndex = 0;
        appState.quiz.score = 0;
        appState.quiz.askedQuestions = [];

        // Filter questions by difficulty
        const allQuestions = knowledgeBase.quizzes[topic as keyof typeof knowledgeBase.quizzes] || [];
        appState.quiz.questions = allQuestions.filter(q => q.difficulty === appState.quiz.difficulty);
        
        if (appState.quiz.questions.length === 0) {
            addMessage(`Désolé, je n'ai pas de quiz de difficulté '${appState.quiz.difficulty}' pour "${topic}".`, 'ai');
            appState.mode = 'idle';
            return;
        }

        addMessage(`Excellent choix ! Commençons un quiz sur "${topic}". Prêt(e) ?`, 'ai');
        setTimeout(askNextQuizQuestion, 1500);
    };
    
    const askNextQuizQuestion = () => {
        if (appState.quiz.questionIndex >= appState.quiz.questions.length) {
            endQuiz();
            return;
        }
        
        appState.quiz.currentQuestion = appState.quiz.questions[appState.quiz.questionIndex];
        addMessage(`<strong>Question ${appState.quiz.questionIndex + 1} :</strong> ${appState.quiz.currentQuestion.question}`, 'ai');
    };
    
    const processQuizAnswer = (answer: string) => {
        if (!appState.quiz.currentQuestion) return;
        
        const isCorrect = answer.trim().toLowerCase() === appState.quiz.currentQuestion.answer.toLowerCase();
        
        if (isCorrect) {
            appState.quiz.score++;
            addMessage("Bonne réponse ! 👍", 'ai');
        } else {
            addMessage(`Ce n'est pas tout à fait ça. La bonne réponse était : <strong>${appState.quiz.currentQuestion.answer}</strong>.`, 'ai');
        }
        
        addMessage(appState.quiz.currentQuestion.explanation, 'ai');

        appState.quiz.questionIndex++;
        setTimeout(askNextQuizQuestion, 2000);
    };

    const endQuiz = () => {
        const totalQuestions = appState.quiz.questions.length;
        const score = appState.quiz.score;
        const percentage = Math.round((score / totalQuestions) * 100);
        let message = `Quiz terminé ! Tu as obtenu <strong>${score} sur ${totalQuestions}</strong> (${percentage}%).`;
        
        if (percentage >= 80) {
            message += " Excellent travail ! Tu maîtrises bien ce sujet. 💪";
            if (appState.quiz.topic) {
                appState.userProgress.masteredTopics.add(appState.quiz.topic);
                saveUserProgress();
                updateProgressBar();
                renderLearningGoals();
            }
        } else if (percentage >= 50) {
            message += " Pas mal ! Continue de t'entraîner pour devenir un expert.";
        } else {
            message += " Ne te décourage pas. Chaque erreur est une occasion d'apprendre. Veux-tu revoir la leçon sur ce sujet ?";
        }

        addMessage(message, 'ai');
        appState.mode = 'idle';
    };
    
    const startPracticeMode = (topic: string) => {
        appState.mode = 'practice';
        appState.practice.topic = topic;
        appState.practice.exerciseIndex = 0;
        appState.practice.exercises = knowledgeBase.practiceExercises[topic as keyof typeof knowledgeBase.practiceExercises] || [];

        if (appState.practice.exercises.length === 0) {
            addMessage(`Désolé, je n'ai pas d'exercices pratiques pour "${topic}".`, 'ai');
            appState.mode = 'idle';
            return;
        }

        addMessage(`Mode entraînement activé pour "${topic}". Allons-y !`, 'ai');
        setTimeout(askNextPracticeProblem, 1500);
    };
    
    const askNextPracticeProblem = () => {
         if (appState.practice.exerciseIndex >= appState.practice.exercises.length) {
            endPracticeMode();
            return;
        }
        
        appState.practice.currentExercise = appState.practice.exercises[appState.practice.exerciseIndex];
        addMessage(`<strong>Exercice ${appState.practice.exerciseIndex + 1} :</strong> ${appState.practice.currentExercise.problem}`, 'ai');
    };
    
    const processPracticeAnswer = async (answer: string) => {
        if (!appState.practice.currentExercise) return;
        
        const typingIndicator = showTypingIndicator();
        try {
            const prompt = `L'élève a répondu "${answer}" à la question "${appState.practice.currentExercise.problem}".
            Vérifie si la réponse est correcte.
            Si c'est correct, félicite-le et explique brièvement pourquoi.
            Si c'est incorrect, ne donne pas la réponse finale, mais donne un indice ou pose une question pour le guider vers la bonne méthode.
            Sois encourageant.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    systemInstruction: getSystemInstruction('practice'),
                }
            });

            hideTypingIndicator(typingIndicator);
            addMessage(response.text, 'ai');

            // Heuristic to decide if the answer was correct to move on
            if (response.text.toLowerCase().includes('correct') || response.text.toLowerCase().includes('exactement') || response.text.toLowerCase().includes('parfait')) {
                 appState.practice.exerciseIndex++;
                 setTimeout(askNextPracticeProblem, 3000);
            }

        } catch (error) {
            console.error("Error evaluating practice answer:", error);
            hideTypingIndicator(typingIndicator);
            addMessage("Oups, une erreur s'est produite. Pourrais-tu répéter ta réponse ?", 'ai');
        }
    };
    
    const endPracticeMode = () => {
        addMessage("Super séance d'entraînement ! Tu t'es bien débrouillé. N'hésite pas si tu veux faire d'autres exercices.", 'ai');
        appState.mode = 'idle';
    };

    const startExam = (topic: string) => {
        const allQuestions = knowledgeBase.quizzes[topic as keyof typeof knowledgeBase.quizzes];
        if (!allQuestions || allQuestions.length === 0) {
            addMessage(`Désolé, je n'ai pas de questions pour un examen sur "${topic}".`, 'ai');
            return;
        }

        switchToChatView();
        chatWindow.innerHTML = '';
        
        appState.mode = 'exam';
        appState.exam.topic = topic;
        appState.exam.userAnswers = [];
        appState.exam.currentQuestionIndex = 0;
        appState.exam.isFinished = false;
        
        appState.exam.questions = [...allQuestions].sort(() => 0.5 - Math.random()).slice(0, 5);
        if (appState.exam.questions.length < 1) { // Check if there are any questions for an exam
             addMessage(`Il n'y a pas assez de questions pour un examen complet sur ce sujet.`, 'ai');
             appState.mode = 'idle';
             return;
        }

        const lessonTitle = knowledgeBase.lessons[topic as keyof typeof knowledgeBase.lessons]?.title || topic;
        examTopicDisplay.textContent = `Examen : ${lessonTitle}`;

        addMessage(`L'examen sur "<strong>${lessonTitle}</strong>" commence. Vous avez ${appState.exam.timeLimit / 60} minutes. Bonne chance !`, 'ai');
        
        if (appState.exam.timerId) clearInterval(appState.exam.timerId);
        let timeLeft = appState.exam.timeLimit;
        appState.exam.startTime = Date.now();
        
        const updateExamTimer = () => {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            examTimerDisplay.textContent = `⏳ ${minutes}:${seconds.toString().padStart(2, '0')}`;
            if (timeLeft <= 0) {
                endExam(true);
            }
            timeLeft--;
        };
        
        updateExamTimer();
        appState.exam.timerId = setInterval(updateExamTimer, 1000);

        examHeader.style.display = 'block';
        setTimeout(askNextExamQuestion, 1500);
    };

    const askNextExamQuestion = () => {
        if (appState.exam.isFinished) return;

        if (appState.exam.currentQuestionIndex >= appState.exam.questions.length) {
            endExam(false);
            return;
        }
        
        examProgressDisplay.textContent = `Question ${appState.exam.currentQuestionIndex + 1} / ${appState.exam.questions.length}`;

        const currentQuestion = appState.exam.questions[appState.exam.currentQuestionIndex];
        addMessage(`<strong>Question ${appState.exam.currentQuestionIndex + 1} :</strong> ${currentQuestion.question}`, 'ai');
    };

    const processExamAnswer = (answer: string) => {
        appState.exam.userAnswers.push(answer.trim());
        appState.exam.currentQuestionIndex++;
        askNextExamQuestion();
    };

    const endExam = (timedOut: boolean) => {
        if (appState.exam.isFinished) return;
        
        appState.exam.isFinished = true;
        appState.mode = 'idle';
        clearInterval(appState.exam.timerId);
        appState.exam.timerId = null;
        examHeader.style.display = 'none';

        if (timedOut) {
            addMessage("Le temps est écoulé !", 'ai');
        } else {
            addMessage("Examen terminé !", 'ai');
        }

        let score = 0;
        appState.exam.questions.forEach((q, index) => {
            const userAnswer = appState.exam.userAnswers[index] || '';
            if (userAnswer.toLowerCase() === q.answer.toLowerCase()) {
                score++;
            }
        });

        const totalQuestions = appState.exam.questions.length;
        const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
        const timeTaken = appState.exam.startTime ? Math.round((Date.now() - appState.exam.startTime) / 1000) : 0;
        const minutes = Math.floor(timeTaken / 60);
        const seconds = timeTaken % 60;

        let resultsHTML = `<div class="exam-results-container">
            <h3>Résultats de l'examen</h3>
            <div class="exam-summary">
                <div class="summary-item ${percentage >= 50 ? 'pass' : 'fail'}">
                    <strong>${percentage}%</strong>
                    <span>${percentage >= 50 ? 'Réussi' : 'Échoué'}</span>
                </div>
                <div class="summary-item">
                    <strong>${score} / ${totalQuestions}</strong>
                    <span>Score</span>
                </div>
                <div class="summary-item">
                    <strong>${minutes}m ${seconds}s</strong>
                    <span>Temps</span>
                </div>
            </div>
            <h4>Révision des réponses</h4>
            <ul class="exam-review-list">`;

        appState.exam.questions.forEach((q, index) => {
            const userAnswer = appState.exam.userAnswers[index] || '(Pas de réponse)';
            const isCorrect = userAnswer.toLowerCase() === q.answer.toLowerCase();
            resultsHTML += `<li class="exam-review-item">
                <p class="review-question">${index + 1}. ${q.question}</p>
                <p class="review-answer ${isCorrect ? 'user-correct' : 'user-incorrect'}">
                    Votre réponse : ${userAnswer}
                </p>`;
            if (!isCorrect) {
                 resultsHTML += `<p class="review-answer correct-answer">
                    Réponse correcte : ${q.answer}
                </p>`;
            }
            resultsHTML += `</li>`;
        });

        resultsHTML += `</ul></div>`;
        addMessage(resultsHTML, 'ai');
        
        if (percentage >= 80 && appState.exam.topic) {
            appState.userProgress.masteredTopics.add(appState.exam.topic);
            saveUserProgress();
            updateProgressBar();
            renderLearningGoals();
            addMessage("Félicitations, vous avez maîtrisé ce sujet !", "ai");
        }
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    const clearStagedFile = () => {
        appState.stagedFile = null;
        fileInput.value = '';
        filePreviewContainer.style.display = 'none';
        filePreviewContainer.innerHTML = '';
    };

    const searchKnowledgeBase = (query: string) => {
        if (!query) {
            searchResultsContainer.innerHTML = '';
            return;
        }
        const lowerQuery = query.toLowerCase();
        let resultsHTML = '';
        let count = 0;

        // Search Lessons
        for (const key in knowledgeBase.lessons) {
            const lesson = knowledgeBase.lessons[key as keyof typeof knowledgeBase.lessons];
            if (lesson.title.toLowerCase().includes(lowerQuery) || key.includes(lowerQuery)) {
                resultsHTML += `<div class="search-result-item" data-topic="${key}" data-type="lesson">
                                    ${lesson.title} <span class="result-type result-type-lesson">Leçon</span>
                                </div>`;
                count++;
            }
        }
        // Search Quizzes
        for (const key in knowledgeBase.quizzes) {
            if (key.toLowerCase().includes(lowerQuery)) {
                resultsHTML += `<div class="search-result-item" data-topic="${key}" data-type="quiz">
                                    Quiz sur ${knowledgeBase.lessons[key as keyof typeof knowledgeBase.lessons]?.title || key} 
                                    <span class="result-type result-type-quiz">Quiz</span>
                                </div>`;
                count++;
            }
        }
        // Search Practice
         for (const key in knowledgeBase.practiceExercises) {
            if (key.toLowerCase().includes(lowerQuery)) {
                resultsHTML += `<div class="search-result-item" data-topic="${key}" data-type="practice">
                                    Exercices sur ${knowledgeBase.lessons[key as keyof typeof knowledgeBase.lessons]?.title || key}
                                    <span class="result-type result-type-practice">Pratique</span>
                                </div>`;
                count++;
            }
        }

        if (count === 0) {
            resultsHTML = `<div class="no-results">Aucun résultat trouvé.</div>`;
        }

        searchResultsContainer.innerHTML = resultsHTML;
    };
    
    const getAutocompleteSuggestions = (query: string) => {
        if (!query) {
            inputSuggestions.style.display = 'none';
            return;
        }
        const lowerQuery = query.toLowerCase();
        const suggestions = uniqueSuggestions.filter(s => s.toLowerCase().includes(lowerQuery));

        if (suggestions.length > 0) {
            const escapeRegExp = (string: string) => {
                // $& means the whole matched string
                return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            };
            const safeQuery = escapeRegExp(query);
            
            inputSuggestions.innerHTML = suggestions.map(s => {
                const regex = new RegExp(`(${safeQuery})`, 'gi');
                const highlighted = s.replace(regex, '<strong>$1</strong>');
                return `<div class="suggestion-item" data-value="${s}">${highlighted}</div>`;
            }).join('');
            inputSuggestions.style.display = 'block';
        } else {
            inputSuggestions.style.display = 'none';
        }
    };
    
    const loadChatFromHistory = async (chatId: string) => {
        const chatSession = appState.lessonHistory.find(item => item.id === chatId && item.type === 'chat');
        if (chatSession) {
            await saveCurrentChatIfNeeded();
            
            appState.isViewingHistory = true;
            switchToChatView();
            backToHistoryBtn.style.display = 'block';
            
            chatWindow.innerHTML = ''; 
            appState.currentChat = [];
            
            chatSession.content.forEach((message: any) => {
                const messageDiv = document.createElement('div');
                messageDiv.className = `message ${message.sender}-message`;
                const icon = document.createElement('div');
                icon.className = 'icon';
                icon.textContent = message.sender === 'ai' ? 'Moi' : 'IA';
                const content = document.createElement('div');
                content.className = 'message-content';
                content.innerHTML = message.text; // Assume text is safe HTML, or sanitize if needed
                messageDiv.appendChild(icon);
                messageDiv.appendChild(content);
                chatWindow.appendChild(messageDiv);
            });

            appState.currentChat = [...chatSession.content];
            chatWindow.scrollTop = chatWindow.scrollHeight;
        }
    };

    const loadLessonFromHistory = async (topic: string) => {
        await saveCurrentChatIfNeeded();

        appState.isViewingHistory = true;
        switchToChatView();
        backToHistoryBtn.style.display = 'block';

        chatWindow.innerHTML = '';
        appState.currentChat = [];

        generateLesson(topic);
    };


    // --- Context Menu Handlers ---
    let activeContextMenuGoal: string | null = null;
    let activeContextMenuHistoryId: string | null = null;

    const showGoalContextMenu = (x: number, y: number, topic: string) => {
        goalContextMenu.style.left = `${x}px`;
        goalContextMenu.style.top = `${y}px`;
        goalContextMenu.style.display = 'block';
        activeContextMenuGoal = topic;
    };
    
    const showHistoryContextMenu = (x: number, y: number, historyId: string) => {
        historyContextMenu.style.left = `${x}px`;
        historyContextMenu.style.top = `${y}px`;
        historyContextMenu.style.display = 'block';
        activeContextMenuHistoryId = historyId;
    };

    const hideContextMenus = () => {
        goalContextMenu.style.display = 'none';
        historyContextMenu.style.display = 'none';
        activeContextMenuGoal = null;
        activeContextMenuHistoryId = null;
    };


    // --- Event Listeners ---
    sendButton.addEventListener('click', handleUserInput);
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleUserInput();
        }
    });

    suggestionButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const target = e.currentTarget as HTMLButtonElement;
            userInput.value = target.dataset.value || '';
            userInput.focus();
            handleUserInput();
        });
    });
    
    charButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const char = (e.currentTarget as HTMLButtonElement).dataset.char;
            if (char) insertAtCursor(char);
        });
    });

    attachFileButton.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        if (target.files && target.files[0]) {
            appState.stagedFile = target.files[0];
            const file = appState.stagedFile;
            
            let previewHTML = '';
            if (file.type.startsWith('image/')) {
                const url = URL.createObjectURL(file);
                previewHTML = `<img src="${url}" alt="Aperçu">`;
            } else {
                previewHTML = `<span>📎</span>`; // Generic file icon
            }

            filePreviewContainer.innerHTML = `
                <div class="file-preview">
                    ${previewHTML}
                    <div class="file-info">
                        <span class="file-name">${file.name}</span>
                        <span class="file-size">${(file.size / 1024).toFixed(1)} Ko</span>
                    </div>
                    <button id="remove-file-btn" title="Retirer le fichier">&times;</button>
                </div>
            `;
            filePreviewContainer.style.display = 'block';

            document.getElementById('remove-file-btn')?.addEventListener('click', clearStagedFile);
        }
    });

    menuToggle.addEventListener('click', () => {
        document.body.classList.toggle('sidebar-collapsed');
    });

    backToHistoryBtn.addEventListener('click', async () => {
        await saveCurrentChatIfNeeded(); // Will do nothing if viewing history, which is correct
        showHistoryView();
    });

    sidebarSearch.addEventListener('input', () => {
        searchKnowledgeBase(sidebarSearch.value);
    });

    searchResultsContainer.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const resultItem = target.closest('.search-result-item') as HTMLDivElement;
        
        if (resultItem) {
            const topic = resultItem.dataset.topic;
            const type = resultItem.dataset.type;

            if (topic) {
                showChatView(); // Switch to new chat view
                if (type === 'lesson') generateLesson(topic);
                if (type === 'quiz') startQuiz(topic);
                if (type === 'practice') startPracticeMode(topic);
            }
            searchResultsContainer.innerHTML = '';
            sidebarSearch.value = '';
        }
    });

    navChat.addEventListener('click', (e) => { e.preventDefault(); showChatView(); });
    navHistory.addEventListener('click', async (e) => { e.preventDefault(); await saveCurrentChatIfNeeded(); showHistoryView(); });
    navSettings.addEventListener('click', async (e) => { e.preventDefault(); await saveCurrentChatIfNeeded(); showSettingsView(); });
    navExam.addEventListener('click', async (e) => { e.preventDefault(); await saveCurrentChatIfNeeded(); showExamView(); });


    userInput.addEventListener('input', () => {
        getAutocompleteSuggestions(userInput.value);
    });

    inputSuggestions.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const suggestionItem = target.closest('.suggestion-item');
        if (suggestionItem instanceof HTMLElement) {
            userInput.value = suggestionItem.dataset.value || '';
            inputSuggestions.style.display = 'none';
            userInput.focus();
            handleUserInput();
        }
    });
    
    // Delegate event for lesson actions and interactive exercises
    chatWindow.addEventListener('click', e => {
        const target = e.target as HTMLElement;

        // Handle "Set as goal" button
        const goalBtn = target.closest('.goal-btn');
        if (goalBtn instanceof HTMLButtonElement) {
             const topic = goalBtn.dataset.topic;
            if (topic) {
                setLearningGoal(topic);
                goalBtn.textContent = '✅ Objectif Ajouté';
                goalBtn.disabled = true;
            }
            return; // Stop further processing
        }
        
        // Handle interactive exercise buttons/inputs
        const exerciseEl = target.closest('.interactive-exercise');
        if (exerciseEl instanceof HTMLElement) {
             let userAnswer: string | null = null;
             
             if (target.classList.contains('exercise-option-btn')) {
                 userAnswer = (target as HTMLButtonElement).dataset.answer ?? null;
             } else if (target.classList.contains('exercise-submit-btn')) {
                 const input = exerciseEl.querySelector('.exercise-text-input') as HTMLInputElement;
                 if (input) userAnswer = input.value;
             }

             if (userAnswer !== null) {
                handleInteractiveExercise(exerciseEl, userAnswer);
             }
        }
    });
    
    learningGoalsList.addEventListener('click', e => {
        const target = e.target as Element;
        const goalItem = target.closest('.goal-item');
         if (goalItem instanceof HTMLElement) {
            const goalTitle = goalItem.title.replace('Travailler sur : ', '');
            if (goalTitle) {
                generateModuleFromGoal(goalTitle);
            }
        }
    });

    learningGoalsList.addEventListener('contextmenu', e => {
        const target = e.target as Element;
        const goalItem = target.closest('.goal-item');
        if (goalItem instanceof HTMLElement) {
            e.preventDefault();
            const topic = goalItem.dataset.topic;
            if (topic) {
                showGoalContextMenu(e.pageX, e.pageY, topic);
            }
        }
    });

    deleteGoalBtn.addEventListener('click', () => {
        if (activeContextMenuGoal) {
            deleteLearningGoal(activeContextMenuGoal);
        }
        hideContextMenus();
    });
    
    addGoalBtn.addEventListener('click', () => {
        const isVisible = addGoalFormContainer.style.display === 'flex';
        addGoalFormContainer.style.display = isVisible ? 'none' : 'flex';
        if (!isVisible) {
            newGoalInput.focus();
        }
    });

    saveGoalBtn.addEventListener('click', () => {
        addCustomLearningGoal(newGoalInput.value);
        newGoalInput.value = '';
        addGoalFormContainer.style.display = 'none';
    });
    
    newGoalInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveGoalBtn.click();
        }
        if (e.key === 'Escape') {
             newGoalInput.value = '';
             addGoalFormContainer.style.display = 'none';
        }
    });

    historyView.addEventListener('contextmenu', e => {
        const historyLink = (e.target as Element).closest('.history-item');
        if (historyLink instanceof HTMLElement) {
            e.preventDefault();
            const historyId = historyLink.dataset.historyId;
            if (historyId) {
                showHistoryContextMenu(e.pageX, e.pageY, historyId);
            }
        }
    });
    
    historyView.addEventListener('click', e => {
        const historyLink = (e.target as Element).closest('.history-item');
         if (historyLink instanceof HTMLElement) {
            e.preventDefault();
            const chatId = historyLink.dataset.chatId;
            const topic = historyLink.dataset.topic;
            if (chatId) {
                loadChatFromHistory(chatId);
            } else if (topic) {
                loadLessonFromHistory(topic);
            }
        }
    });

    examView.addEventListener('click', e => {
        const target = e.target as HTMLElement;
        const examItem = target.closest('.exam-topic-item');
        if (examItem instanceof HTMLElement) {
            e.preventDefault();
            const topic = examItem.dataset.topic;
            if (topic) {
                startExam(topic);
            }
        }
    });


    deleteHistoryBtn.addEventListener('click', () => {
        if (activeContextMenuHistoryId) {
            deleteHistoryItem(activeContextMenuHistoryId);
        }
        hideContextMenus();
    });

    personalityRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            appState.tutorPersonality = (e.target as HTMLInputElement).value;
            saveTutorPersonality();
        });
    });
    
    // Global listener to hide menus
    document.addEventListener('click', (e) => {
        // Hide context menus if clicking outside of them
        if (!(goalContextMenu.contains(e.target as Node)) && !(historyContextMenu.contains(e.target as Node))) {
            hideContextMenus();
        }

        // Hide input suggestions if clicking outside the input area
        if (!inputWrapper.contains(e.target as Node)) {
             inputSuggestions.style.display = 'none';
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            hideContextMenus();
        }
    });


    // --- Initial Setup ---
    const initializeSettings = () => {
        const selectedPersonalityRadio = document.querySelector(`input[name="tutor-personality"][value="${appState.tutorPersonality}"]`) as HTMLInputElement;
        if (selectedPersonalityRadio) {
            selectedPersonalityRadio.checked = true;
        }
    };
    
    showChatView();
    updateProgressBar();
    renderLearningGoals();
    initializeSettings();
});