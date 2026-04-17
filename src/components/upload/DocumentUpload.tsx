import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { Upload, FileText, Scale, Brain, Sparkles, Loader2, BookOpen, Users, Calendar, Lightbulb, Database, MessageSquare } from 'lucide-react'
import { useRAGStore } from '../../store/ragStore'
import { useUIStore } from '../../store/uiStore'
import { extractTextFromPDF, isPDF } from '../../utils/pdfParser'
import type { Document } from '../../types'

// Sample documents - expanded for better visualization (more chunks)
const SAMPLE_DOCS = {
  ai: `Artificial Intelligence (AI) is a branch of computer science that aims to create intelligent machines that can perform tasks typically requiring human intelligence. These tasks include learning, reasoning, problem-solving, perception, and language understanding. The field was officially born at the Dartmouth Conference in 1956, where researchers first coined the term "artificial intelligence."

Machine learning is a subset of AI that enables systems to learn and improve from experience without being explicitly programmed. Deep learning, a further subset, uses neural networks with many layers to analyze various levels of data abstraction. These neural networks are inspired by the structure of the human brain, with interconnected nodes that process information in layers.

Supervised learning is one of the most common types of machine learning. In supervised learning, the model is trained on labeled data, meaning the correct answers are provided during training. The model learns to map inputs to outputs by finding patterns in the training data. Examples include spam detection, image classification, and price prediction.

Unsupervised learning is another important paradigm where the model finds patterns in unlabeled data. Clustering algorithms group similar data points together without being told what the groups should be. Dimensionality reduction techniques like PCA and t-SNE help visualize high-dimensional data. These methods are used in customer segmentation, anomaly detection, and exploratory data analysis.

Reinforcement learning is a third major paradigm where an agent learns by interacting with an environment. The agent receives rewards or penalties based on its actions and learns to maximize cumulative reward over time. This approach has achieved remarkable success in game playing, robotics, and resource management.

AI applications are widespread today, from virtual assistants like Siri and Alexa to recommendation systems on Netflix and Spotify. Self-driving cars use AI to perceive their environment and make decisions. Healthcare uses AI for diagnosis, drug discovery, and personalized treatment plans. Financial institutions use AI for fraud detection and algorithmic trading.

Natural Language Processing (NLP) enables machines to understand and generate human language. Modern NLP systems can translate between languages, summarize documents, answer questions, and engage in conversation. Sentiment analysis helps businesses understand customer opinions from reviews and social media.

Computer vision allows machines to interpret and analyze visual information from the world. Applications include facial recognition, medical image analysis, quality control in manufacturing, and augmented reality. Self-driving cars rely heavily on computer vision to navigate safely.

The field continues to advance rapidly, with new breakthroughs in natural language processing, computer vision, and reinforcement learning. Large Language Models (LLMs) like GPT and Claude represent recent advances in AI's ability to understand and generate human-like text. These models are trained on vast amounts of text data and can perform a wide variety of tasks.

Ethical considerations in AI have become increasingly important. Issues include algorithmic bias, privacy concerns, job displacement, and the potential for misuse. Responsible AI development requires careful attention to fairness, transparency, and accountability. Researchers and policymakers are working to establish guidelines and regulations for AI systems.`,

  rag: `Retrieval-Augmented Generation (RAG) is an AI technique that combines information retrieval with text generation. Instead of relying solely on what a language model learned during training, RAG fetches relevant information from a knowledge base to generate more accurate and up-to-date responses. This approach addresses several limitations of traditional language models.

The fundamental problem that RAG solves is the knowledge cutoff issue. Language models are trained on data up to a certain date, meaning they cannot know about events or information that emerged after training. RAG allows the model to access current information by retrieving it from an external knowledge base at query time.

Document processing is the first stage of building a RAG system. Raw documents must be converted into a format suitable for retrieval. This typically involves extracting text from various file formats like PDF, Word, or HTML. The text is then cleaned and preprocessed to remove irrelevant content.

Chunking is a critical step in RAG where documents are split into smaller pieces. The chunk size is important: too large and retrieval becomes imprecise, too small and context is lost. Common strategies include fixed-size chunking, sentence-based chunking, and semantic chunking based on topic boundaries. Overlap between chunks helps preserve context across chunk boundaries.

Embedding generation converts text chunks into dense vector representations. These embeddings capture the semantic meaning of the text in a high-dimensional space. Similar concepts have similar vectors, enabling semantic search. Popular embedding models include OpenAI's ada-002, sentence-transformers, and Cohere embeddings.

Vector databases store embeddings and enable efficient similarity search. When a query comes in, it's converted to an embedding and the database finds the most similar document embeddings. Popular vector databases include Pinecone, Weaviate, Chroma, Milvus, and Qdrant. Each has different trade-offs in terms of scale, speed, and features.

The retrieval step finds the most relevant chunks for a given query. Similarity is typically measured using cosine similarity or dot product between embeddings. Top-k retrieval returns the k most similar chunks. Advanced techniques like hybrid search combine dense retrieval with keyword-based search for better results.

Context assembly combines retrieved chunks into a prompt for the language model. The chunks are formatted and concatenated, along with the original question and any system instructions. The total context must fit within the model's context window, which varies by model.

Generation is the final step where the language model produces a response based on the provided context. The model is instructed to only use information from the context, reducing hallucination. Some systems ask the model to cite specific chunks in its response.

RAG offers several advantages over traditional language models. It reduces hallucinations by grounding responses in factual content. It enables access to private or recent information not in the model's training data. It also allows for citations and source attribution. The knowledge base can be updated without retraining the model.

Advanced RAG techniques improve retrieval quality. Query expansion reformulates the original query to capture different phrasings. Hypothetical Document Embedding (HyDE) generates a hypothetical answer and uses it for retrieval. Reranking uses a separate model to reorder retrieved chunks by relevance.

Evaluation of RAG systems involves multiple metrics. Retrieval quality can be measured with precision and recall. Generation quality is assessed through relevance, faithfulness, and fluency. Human evaluation remains important for subjective aspects.

Common use cases for RAG include enterprise search, customer support chatbots, research assistants, and knowledge management systems. The technique is particularly valuable when accuracy and up-to-date information are critical. Legal research, medical information systems, and technical documentation are prime examples.`,

  euCharter: `CHARTER OF FUNDAMENTAL RIGHTS OF THE EUROPEAN UNION

PREAMBLE

The peoples of Europe, in creating an ever closer union among them, are resolved to share a peaceful future based on common values.

Conscious of its spiritual and moral heritage, the Union is founded on the indivisible, universal values of human dignity, freedom, equality and solidarity; it is based on the principles of democracy and the rule of law. It places the individual at the heart of its activities, by establishing the citizenship of the Union and by creating an area of freedom, security and justice.

TITLE I - DIGNITY

Article 1 - Human dignity
Human dignity is inviolable. It must be respected and protected.

Article 2 - Right to life
1. Everyone has the right to life.
2. No one shall be condemned to the death penalty, or executed.

Article 3 - Right to the integrity of the person
1. Everyone has the right to respect for his or her physical and mental integrity.
2. In the fields of medicine and biology, the following must be respected in particular: the free and informed consent of the person concerned, according to the procedures laid down by law.

Article 4 - Prohibition of torture and inhuman or degrading treatment or punishment
No one shall be subjected to torture or to inhuman or degrading treatment or punishment.

Article 5 - Prohibition of slavery and forced labour
1. No one shall be held in slavery or servitude.
2. No one shall be required to perform forced or compulsory labour.
3. Trafficking in human beings is prohibited.

TITLE II - FREEDOMS

Article 6 - Right to liberty and security
Everyone has the right to liberty and security of person.

Article 7 - Respect for private and family life
Everyone has the right to respect for his or her private and family life, home and communications.

Article 8 - Protection of personal data
1. Everyone has the right to the protection of personal data concerning him or her.
2. Such data must be processed fairly for specified purposes and on the basis of the consent of the person concerned or some other legitimate basis laid down by law.

Article 9 - Right to marry and right to found a family
The right to marry and the right to found a family shall be guaranteed in accordance with the national laws governing the exercise of these rights.

Article 10 - Freedom of thought, conscience and religion
1. Everyone has the right to freedom of thought, conscience and religion. This right includes freedom to change religion or belief and freedom, either alone or in community with others and in public or in private, to manifest religion or belief, in worship, teaching, practice and observance.

Article 11 - Freedom of expression and information
1. Everyone has the right to freedom of expression. This right shall include freedom to hold opinions and to receive and impart information and ideas without interference by public authority and regardless of frontiers.
2. The freedom and pluralism of the media shall be respected.

Article 12 - Freedom of assembly and of association
1. Everyone has the right to freedom of peaceful assembly and to freedom of association at all levels, in particular in political, trade union and civic matters.

TITLE III - EQUALITY

Article 20 - Equality before the law
Everyone is equal before the law.

Article 21 - Non-discrimination
1. Any discrimination based on any ground such as sex, race, colour, ethnic or social origin, genetic features, language, religion or belief, political or any other opinion, membership of a national minority, property, birth, disability, age or sexual orientation shall be prohibited.

Article 22 - Cultural, religious and linguistic diversity
The Union shall respect cultural, religious and linguistic diversity.

Article 23 - Equality between women and men
Equality between women and men must be ensured in all areas, including employment, work and pay.`
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function DocumentUpload() {
  const { t } = useTranslation()
  const { document, setDocument } = useRAGStore()
  const { setCurrentStep } = useUIStore()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const processFile = useCallback(async (file: File) => {
    setIsProcessing(true)
    setError(null)

    try {
      let content: string

      // Handle PDF files with proper parsing
      if (isPDF(file)) {
        content = await extractTextFromPDF(file)
        if (!content.trim()) {
          throw new Error('Could not extract text from PDF. The PDF might be scanned/image-based.')
        }
      } else {
        // TXT and MD files can use text() directly
        content = await file.text()
      }

      const doc: Document = {
        id: crypto.randomUUID(),
        name: file.name,
        content,
        size: file.size,
        type: file.name.endsWith('.md') ? 'md' : file.name.endsWith('.pdf') ? 'pdf' : 'txt',
      }
      setDocument(doc)
      setCurrentStep(2)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file')
      console.error('File processing error:', err)
    } finally {
      setIsProcessing(false)
    }
  }, [setDocument, setCurrentStep])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      processFile(acceptedFiles[0])
    }
  }, [processFile])

  const loadSampleDoc = (key: 'ai' | 'rag' | 'euCharter') => {
    const names = {
      ai: 'Introduction to AI.txt',
      rag: 'How RAG Works.txt',
      euCharter: 'EU Charter of Fundamental Rights.txt',
    }
    const doc: Document = {
      id: crypto.randomUUID(),
      name: names[key],
      content: SAMPLE_DOCS[key],
      size: SAMPLE_DOCS[key].length,
      type: 'txt',
    }
    setDocument(doc)
    setCurrentStep(2)
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
  })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* RAG Introduction & Fact Sheet */}
      <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 rounded-2xl border border-indigo-200 p-6 shadow-sm">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            <span className="text-indigo-600">RAG</span> = {t('intro.abbreviation')}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('intro.definition')}
          </p>
        </div>

        {/* Fact Sheet Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {/* Origin */}
          <div className="flex items-start gap-3 p-3 bg-white/70 rounded-xl">
            <div className="p-2 bg-indigo-100 rounded-lg shrink-0">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">{t('intro.createdBy')}</p>
              <p className="text-sm text-gray-800 font-medium">{t('intro.authors')}</p>
              <p className="text-xs text-gray-500">{t('intro.organization')}</p>
            </div>
          </div>

          {/* Date */}
          <div className="flex items-start gap-3 p-3 bg-white/70 rounded-xl">
            <div className="p-2 bg-purple-100 rounded-lg shrink-0">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide">{t('intro.published')}</p>
              <p className="text-sm text-gray-800 font-medium">{t('intro.publishDate')}</p>
              <p className="text-xs text-gray-500">{t('intro.conference')}</p>
            </div>
          </div>

          {/* Paper */}
          <div className="flex items-start gap-3 p-3 bg-white/70 rounded-xl">
            <div className="p-2 bg-blue-100 rounded-lg shrink-0">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">{t('intro.paper')}</p>
              <p className="text-sm text-gray-800 font-medium leading-tight">"{t('intro.paperTitle')}"</p>
            </div>
          </div>
        </div>

        {/* How RAG Works - Visual */}
        <div className="bg-white/80 rounded-xl p-4 border border-indigo-100">
          <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            {t('intro.howItWorks')}
          </h3>
          <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4 text-sm">
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-800">{t('intro.stepQuery')}</span>
            </div>
            <span className="text-gray-400 text-lg">→</span>
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg border border-green-200">
              <Database className="w-4 h-4 text-green-600" />
              <span className="font-medium text-green-800">{t('intro.stepRetrieve')}</span>
            </div>
            <span className="text-gray-400 text-lg">→</span>
            <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 rounded-lg border border-purple-200">
              <Brain className="w-4 h-4 text-purple-600" />
              <span className="font-medium text-purple-800">{t('intro.stepGenerate')}</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 text-center mt-3">
            {t('intro.explanation')}
          </p>
        </div>

        {/* Key Benefits */}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">{t('intro.benefitHallucinations')}</span>
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">{t('intro.benefitCurrent')}</span>
          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">{t('intro.benefitSources')}</span>
          <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">{t('intro.benefitNoRetrain')}</span>
        </div>
      </div>

      {/* Try It Out Section */}
      <div className="text-center mb-2">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">{t('steps.upload.title')}</h2>
        <p className="text-gray-500">{t('steps.upload.sampleDocs')}</p>
      </div>

      {/* BIG CLICKABLE SAMPLE DOCUMENT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* AI Introduction */}
        <motion.button
          onClick={() => loadSampleDoc('ai')}
          whileHover={{ scale: 1.03, y: -4 }}
          whileTap={{ scale: 0.98 }}
          className="group p-6 bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-2xl border-2 border-purple-200 hover:border-purple-400 transition-all text-left shadow-sm hover:shadow-lg"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-500 rounded-xl group-hover:scale-110 transition-transform">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <span className="text-xs font-medium text-purple-500 uppercase tracking-wide">Sample 1</span>
            </div>
          </div>
          <h3 className="text-lg font-bold text-purple-900 mb-1">{t('steps.upload.sample1')}</h3>
          <p className="text-sm text-purple-700">Learn about artificial intelligence, machine learning, and modern AI applications</p>
          <div className="mt-3 text-xs text-purple-500">~5,500 characters • More chunks!</div>
        </motion.button>

        {/* RAG Explanation */}
        <motion.button
          onClick={() => loadSampleDoc('rag')}
          whileHover={{ scale: 1.03, y: -4 }}
          whileTap={{ scale: 0.98 }}
          className="group p-6 bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-2xl border-2 border-green-200 hover:border-green-400 transition-all text-left shadow-sm hover:shadow-lg"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-500 rounded-xl group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <span className="text-xs font-medium text-green-500 uppercase tracking-wide">Sample 2</span>
            </div>
          </div>
          <h3 className="text-lg font-bold text-green-900 mb-1">{t('steps.upload.sample2')}</h3>
          <p className="text-sm text-green-700">Understand retrieval-augmented generation and its advantages over traditional LLMs</p>
          <div className="mt-3 text-xs text-green-500">~5,000 characters • More chunks!</div>
        </motion.button>

        {/* EU Charter */}
        <motion.button
          onClick={() => loadSampleDoc('euCharter')}
          whileHover={{ scale: 1.03, y: -4 }}
          whileTap={{ scale: 0.98 }}
          className="group p-6 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-2xl border-2 border-blue-200 hover:border-blue-400 transition-all text-left shadow-sm hover:shadow-lg"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-500 rounded-xl group-hover:scale-110 transition-transform">
              <Scale className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <span className="text-xs font-medium text-blue-500 uppercase tracking-wide">Sample 3</span>
            </div>
          </div>
          <h3 className="text-lg font-bold text-blue-900 mb-1">{t('steps.upload.sample3')}</h3>
          <p className="text-sm text-blue-700">Charter of Fundamental Rights - dignity, freedoms, equality, and more</p>
          <div className="mt-3 text-xs text-blue-500">~5,000 characters</div>
        </motion.button>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4 py-2">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-sm text-gray-400 font-medium">or use your own</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* Error message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-700"
        >
          <p className="font-medium">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-sm text-red-600 hover:underline"
          >
            Dismiss
          </button>
        </motion.div>
      )}

      {/* Dropzone - AFTER samples */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer
          transition-all duration-300
          ${isProcessing
            ? 'border-blue-400 bg-blue-50 cursor-wait'
            : isDragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }
        `}
      >
        <input {...getInputProps()} disabled={isProcessing} />

        <motion.div
          animate={isDragActive ? { scale: 1.05 } : { scale: 1 }}
          className="flex flex-col items-center gap-3"
        >
          <div className={`p-3 rounded-full ${isProcessing || isDragActive ? 'bg-blue-100' : 'bg-gray-100'}`}>
            {isProcessing ? (
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            ) : (
              <Upload className={`w-6 h-6 ${isDragActive ? 'text-blue-600' : 'text-gray-400'}`} />
            )}
          </div>
          <div>
            <p className="font-medium text-gray-700">
              {isProcessing
                ? 'Processing file...'
                : isDragActive
                  ? 'Drop your file here'
                  : t('steps.upload.dropzone')}
            </p>
            <p className="text-sm text-gray-500">
              {isProcessing ? 'Extracting text content' : 'or click to browse • TXT, MD, PDF'}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Current document info */}
      {document && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-green-50 rounded-xl border-2 border-green-300"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500 rounded-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-green-800">{document.name}</p>
              <p className="text-sm text-green-600">
                {formatFileSize(document.size)} • {document.content.length.toLocaleString()} characters
              </p>
            </div>
            <button
              onClick={() => setCurrentStep(2)}
              className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold shadow-sm"
            >
              {t('nav.next')}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
