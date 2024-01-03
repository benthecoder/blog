---
title: 'On Learning (for programmers)'
tags: 'programming'
date: 'Jan 2, 2024'
---

It's the start of a new year.

What better way to start, than learning about learning, for programmers.

The day before, I wrote about learning to code. Today, we go one step further and learn about learning itself.

Below outlines [10](https://cacm.acm.org/magazines/2024/1/278891-10-things-software-developers-should-learn-about-learning/fulltext) research-backed findings about learning that apply to software developers, and their practical implications.

### tl;dr

- learning takes time, including time between learning. use spaced repetition. take breaks between learning sessions (90 min)
- learn to chunk information by practicing more problems, recognizing patterns, to boost your working memory functionally and build up a mental library of patterns
- spend time away from a problem, take a walk, chat with friends and family
- internet and AI is a double-edged sword, use it cautiously, if your goal is to learn, think of an answer before searching, understand the answer deeply, go one step further, learn the deeper structure
- use examples to go between abstract and concrete learnable facts (repacking <-> unpacking)
- seek to succeed (rather than avoid failures) and believe that ability is changeable, that struggles are not dead ends but an opportunity to grow

### 1. Human memory is not made of bits

> tl;dr: human memory is fragile and unreliable, we're not just storing and retrieving like computers. but the benefit is problem solving and deep understanding by connecting knowledge together.

- memory and learning: "Learning means that there has been a change made in one's long-term memory."
- with computers, we can store a series of bits and later retrieve the exact series of bits in memory; human memory is neither as precise nor as reliable.
- computers have two operations: read and write. human memory has "**read-and-update**" operation, where fetching a memory can both strengthen and modify it – a process called <mark>reconsolidation</mark>.
  - modification is more likely on recently formed memories
- <mark>spreading activation</mark>: when trying to remember something, we activate a pathway of neurons to access the targeted information
  - pathways can stay **primed for hours**
  - this activation is not contained within one pathway, and cat spread to other connected pathways
  - implications
    - negative: recall can be unreliable as imprecise information can be mixed and conflated with target information
    - positive: stepping away from problems can allow two unrelated areas to connect, arising creative and unique solutions. this is why taking walks and showers helps.

### 2. Human memory has one limited and one unlimited system

> tl;dr: when faced with a task beyond your ability, reorganize it, decompose it into smaller pieces that can be processed and chunked. reduces extraneous load, boost working memory.

- two main components of memory
  - **long-term memory**: information is permanently stored and is functionally limitless
    - analogy: computer disk storage
  - **working memory** (wm): used for consciously reasoning about information for problem solving and is limited.
    - analogy: CPU registers
- long-term vs wm
  - wm is roughly fixed at birth, higher wm != higher general intelligence, but faster learning.
  - ex: expert programmers can have low or high wm but it's contents of their long-term memory that mke them experts
- <mark>chunking</mark>
  - group multiple piece of information as one piece in wm
    - ex: ben@gmail.com is one piece of information, and not a random string of characters
  - more chunking == larger working memory, functionally
  - how to chunk? practice using information and solving problems
- <mark>cognitive load</mark>
  - is amount of working memory **capacity**, demanded by task.
  - two parts: intrinsic and extraneous
    - **intrinsic**: how many chunks are necessary to achieve a task
    - **extraneous**: unnecessary information that is part of performing the task
    - ex: presentation format varies extraneous cognitive load. a implementing a a database schema is better with diagrams than plain text (you have to mentally transform them)
    - **if you're a beginner, extraneous load is higher** because you can't distinguish intrinsic and extraneous easily.

### 3. experts recognize, beginners reason.

> tl;dr: experts can reason at higher level by pulling from their mental library of patterns, freeing up cognition.

- cognition is split into system 1 & 2
  - System 1: fast, pattern recognition in long-term memory
  - System 2: slower, reasoning in working memory
- experts are experts because they've done <mark>pattern matching</mark> a lot more than beginners. like chess players who can remember and recognize the state of the board, programmers recognize "design patterns"
- beginners can become experts by reading and understanding a lot of code
- seeing a variety of programming paradigms so you have a wide pool of patterns.

### 4. understanding a concept goes from abstract to concrete and back

> tl;dr: experts look at generics and abstract ters, beginners focus on surface details and can't see the big picture

- making <mark>[semantic waves](https://www.sciencedirect.com/science/article/abs/pii/S0898589812000678)</mark>
  - when learning a new concept, you benefit from both forms of explanation: abstract features and concrete details with examples, and **switching between them**.
  - <mark>unpacking</mark>: gather several diverse examples (even wrong ones) of a concept to learn an abstract concept
  - <mark>repacking</mark>: deeper understanding through recognizing how multiple details from examples connects to the abstract concept
- abstract -> concrete
  - when learning abstract concepts, you reach for concrete instantiations of concepts to examine
  - as concepts get more abstract (values -> variables -> functions -> metaclasses), distance to concrete examples increases
  - the saving grace is, as we learn abstract concepts, they become more concrete (a chunk) to us.

### 5. Spacing and repetition matter

> tl;dr: space out practice across multiple sessions, days, and ideally weeks, rest is important to consolidate information

- <mark>spacing effect</mark>
  - works because of relationship between long-term & working memory
  - when practice solving problems, it's two skills
    - 1\) **match**: pattern matching information to concepts that can solve it
      - requires activating correct neural pathway in long-term memory
    - 2\) **apply**: applying the concepts to create solutions
  - why space out?
    - if you repeatedly solve the same problem, pathway stays active, so skill #1 is not practiced.
    - not spacing out -> people can only solve problems when told which concept to use
    - interleaving different problems -> pathways take time to return to baseline, making spacing necessary to get the most out of practice time (because your brain needs to rest and reset)
- learning sessions
  - limit to <mark>90 minutes or less</mark>
  - take 20 minutes to rest after each session, really rest by going for a walk / sitting quietly
  - rest speeds up consolidation process (also happens during sleep)
- maximizing efficiency for learning
  - **randomize order** of type of problems being solved, so different concepts are activated in long-term memory
  - take **short breaks** at random intervals to enhance memory consolidation
    - 10s break every 2-5 min is recommended

### 6. internet has not made learning obsolete

> tl;dr: be more careful about using AI as beginners, try to think of an answer before searching. there's a difference between a beginner who has never learned the details and lacks memory connection, and an expert who has learned deeper structure but has forgotten the fine details.

- AI tools can write code, and knowledge is available from internet within seconds, but do you understand/learn anything?
- learning is required to become an expert
  - learning = storing bits of knowledge in long-term memory and <mark>forming connections</mark> between them
  - if knowledge is not present in the brain, it's because you have not learned it well, and the brain cannot form any connections between them
  - higher levels of understanding and abstraction are not possible
- why searching internet bad
  - less efficient for remembering information (compared to physical books)
  - immediately searching is worse recall of same information, rather than thinking of an answer first
  - searching robs the brain of benefits of memory-strengthening effect of recalling information
- context switching
  - searching requires switching working memory from task at hand (coding) to a new cognitive task (searching and filtering and assessing)
  - if the knowledge is memorized, access is much faster (like a cache verses fetching from disk)

### 7. problem-solving is not a generic skill

> tl;dr: teaching problem-solving != teaching programming, we learn specific skills like programming, the best chess move, how to create a knitting pattern, each of these skills are separate and don't influence each other. teach programming with programming practice problems

- problem-solving & programming
  - problem-solving is a large part, but you can't directly teach it as a specific skill
  - even though it can be applied to different aspects of programming (design, debugging), it's not a generic skill
- domain-specific problem-solving > generic
  - while we can learn to reason, <>we don't learn how to solve problems in general</mark>
  - we learn specific skills and they are separate and don't influence each other
  - ex: chess has little to no effect on other academic and cognitive skills.
- spatial skills is an exception
  - allows us to visualize objects in our mind
  - can improve learning in other disciplines: such as performance on a range of non-verbal skills

### 8. expertise can be problematic in some situations

> tl;dr: experts who transfer knowledge from one language to another can lead to faulty knowledge. they also have difficulties seeing things through a beginner's lens.

- transfer knowledge
  - experts know multiple programming languages, and transferring knowledge between them can lead to errors
  - ex: difference in semantics between languages between Java and C++ in inheritance
- <mark>expert blind-spot problem</mark>
  - experts have difficulty seeing things through the eyes of a beginner
  - overcome this by listening carefully to beginners, check their understanding, and tailor accordingly
- <mark>tacit knowledge</mark>
  - knowledge becomes so automated that it's hard for experts to verbalize: "i just know"
  - beginners can learn better from instructional materials or a knowledgable peer (bridges the gap between beginners and experts)

### 9. predictors of programming ability are unclear

> tl;dr: intelligent people will not always make good programmers, and good programmers need not be high in general intelligence.

- aptitude + practice
  - a mix of this is needed for success in anything
  - purely aptitude "you're born with it" and purely practice "10,000 hours" idea are two extreme views.
- years of experience?
  - there is weak link between years of experience and success in early career
  - aptitude may be stronger than experience in early years
- weak predictors
  - (in early programming) **general intelligence** and **working memory capacity**
  - these predict <mark>rate of learning</mark> rather than absolute ability
  - spatial reasoning is a stronger predictor of success in programming, though still quite moderate

### 10. mindset matters

> tl;dr: a growth mindset helps you persist through challenges and overcome failures, but it takes effort to adopt the mindset. Seek help, take breaks, just because you're struggling doesn't mean you're not cut out for it.

- programming ability is not binary: you can or cannot
  - two theories
    - <mark>learning edge momentum</mark>: each topic is dependent on the previous, so you will fall behind if you can't catch up
    - geek gene: you're born with it or not (little empirical evidence)
  - difference in programming ability = difference in prior experience
    - ex: person A and B in same class, degree can have vastly different knowledge skills, either behind or ahead of learning edge momentum, making them seem "born with it" or not
- fixed vs growth mindset
  - **fixed mindset**: people's abilities are innate and unchanging. if you struggle, you're not cut out for it
  - <mark>growth mindset</mark>: people's abilities are malleable. if you struggle, **with enough practice**, you can master it.
  - the middle ground: anyone can learn Math, even if they're not initially good, but you won't get a Nobel Prize no matter how much you practice. However, with a growth mindset, you can **persist through difficulties and overcome failure more consistently**
- growth mindset is hard to promote, misconceptions
  - #1 reward effort than performance
    - growth mindset favors practice over aptitude, so teachers reward effort, but learners aren't stupid, they know when they're not progressing.
    - solution: only reward effort when learner is using effective strategies and is actually succeeding
  - #2 growth mindset is static
    - due to set backs and failure, people skew toward fixed mindset because the boundaries of their abilities are not clear
    - solution: practice overcoming setbacks and failures
- goal orientation: <mark>approach & avoidance</mark>
  - **approach**: wanting to do well -> positive learning behaviours: working hard, seeking help, trying new challenges
  - **avoidance**: avoiding failure -> negative behaviours: disorganized study, not seeking help, performance anxiety, avoiding challenge
- how to adopt growth mindset
  - seek honest feedback about your skill progression
  - review the efficacy of your learning strategies
    - note down times when you are doubtful
  - expect shifts towards fixed mindset, but growth mindset can be redeveloped and made stronger with practice
  - if you feel like quitting, take a break, take a walk, consider different strategies
