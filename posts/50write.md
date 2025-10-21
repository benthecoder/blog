---
title: '50 reasons to write'
tags: 'writing, listicles'
date: 'May 28, 2024'
---

Imagine this. You found a dozen good articles on writing, but you don't have the time to sit down and read each one of them. Well, LLMs are perfect for this! But how do you feed them to GPT4? Is there already a tool for this? Where you provide your links, and it can start a chat for you?

There's [exa.ai](https://exa.ai/) which helps you find good content, and perplexity that searches content based on your query, and provides you with answers. And there are AI writing tools for research that helps you search papers, chat with papers, and write and cite papers for you, and you can add your own knowledge too.

What I want is something that exist in that mix of tools. Let's say I'm diving into the rabbit hole of climate change, specifically in how AI can be used to [transform the energy network](https://www.technologyreview.com/2023/11/22/1083792/ai-power-grid-improvement/), and I found 10 great articles talking about that.

It's either I save these articles in another platform, and exa.ai can source even more related articles, I select the ones I want, and I can start a chat. And ideally this chat will continue to help me discover more related sources, and help me build a map of knowledge around that topic. And it should be something I can come back to and revisit.

Or it would be cooler if Arc eventually let's you chat with multiple tabs (it only supports a single website currently by pressing CMD+F), where you put all articles in a bookmark group, and you can begin a conversation.

Anyways, I coded a basic solution by just extracting the text from each blog using [Trafilatura](https://trafilatura.readthedocs.io/en/latest/index.html), and then passing it all in an API call.

this is my prompt:

> You have been provided with a set of articles. Please read the articles and answer the following question based on the content of the articles.
> **Question/Instruction:** {question}  
> **Articles:**  
> {all_article_texts}  
> **Instructions:**
>
> 1. Answer this question **ONLY** based on the articles provided. Do not include any other content aside from > the provided material
> 2. If the question does not relate to the theme of the articles, respond saying 'I cannot answer this question based on the provided articles.'
> 3. When writing the essay, reference specific points from the articles to back up your claims.
> 4. Make it engaging and informative, ensuring that the essay is well-structured and coherent.
> 5. Make sure to cite your sources with [1], [2], in the essay, and list them at the end using the provided > titles and URLs. in the format 1. \[Title\](URL)
> 6. Respond in markdown format.

To test it, I passed a list of articles on writing from my [1 year review](/posts/1yearreview) post, and this is the LLM's response to 50 reasons to write:

1. **Crystallized Thought**: Writing helps in expressing and organizing messy and interconnected ideas
2. **Knowledge Distillation**: It allows for the distillation of knowledge into a coherent form
3. **Self-Expression**: Writing is a way to access and construct one's interiority
4. **Living Extension**: What you write becomes a living extension of yourself
5. **Reinterpretation**: Writing allows for the reinterpretation and adaptation of thoughts
6. **New Perspectives**: It provides new perspectives through language and terminology
7. **Shared Fictions**: Writing enables people from different backgrounds to build shared fictions
8. **Intellectual Contribution**: It serves as a gift and offering of ideas to others
9. **Autonomous Knowledge**: Writing is a form of self-contained and self-spreading knowledge
10. **Artistic Expression**: Writing can be an art form, indulging readers and providing an escape from the mundane
11. **Thinking Tool**: Writing is a way to decide what to say before saying it, helping to grasp and improve thoughts
12. **Claims and Reasoning**: It allows for the presentation of claims, reasons, and responses to challenges
13. **Search Query**: Writing helps find like-minded individuals and build a community
14. **Reflection**: Writing reveals you to yourself, bringing clarity to internal thoughts
15. **Memory Enhancement**: It helps in creating clearer and more vivid memories
16. **Self-Improvement**: Regular writing leads to self-improvement by confronting and addressing inadequacies
17. **Closure**: Writing can provide closure by processing thoughts independently
18. **Articulation**: It helps in articulating thoughts more coherently in conversations
19. **Idea Generation**: Writing generates new ideas and solutions
20. **Mental Clarity**: It brings mental clarity and helps in organizing thoughts
21. **Self-Knowledge**: Writing helps in understanding one's mind better
22. **Synthesis**: It synthesizes thoughts and experiences into a coherent whole
23. **Unexpected Thoughts**: Writing often leads to unexpected thoughts and insights
24. **Agency**: Writing gives a sense of control over one's life
25. **Presence**: It grounds you in the present moment
26. **Feeling Seen**: Writing makes you feel seen and understood by yourself and others
27. **Clear Thinking**: It exposes gaps in your thinking and helps in understanding topics better
28. **Mental Dialogue**: Writing is a form of Socratic dialogue with oneself
29. **Bias Awareness**: It helps in recognizing and addressing personal biases
30. **Serendipity**: Writing increases the chances of serendipitous opportunities
31. **Surface Area**: It increases your surface area on the internet, making you more discoverable
32. **Iterative** Improvement: Writing and publishing allow for iterative improvement of ideas
33. **Honesty**: Publishing writing keeps you honest and accurate
34. **Persuasion**: Writing can be a powerful tool for persuasion
35. **Learning**: Writing enhances learning and knowledge retention
36. **Networking**: It helps in building a professional network
37. **Self-Reflection**: Writing is a form of self-reflection and personal growth
38. **Idea Refinement**: It refines and clarifies ideas through exploration
39. **Public Accountability**: Publishing writing creates public accountability
40. **Mental Exercise**: Writing is a mental exercise that sharpens thinking
41. **Emotional Processing**: It helps in processing emotions and experiences
42. **Legacy**: Writing leaves a legacy and contributes to collective knowledge
43. **Creativity**: It fosters creativity and innovation
44. **Problem-Solving**: Writing aids in problem-solving by organizing thoughts
45. **Communication Skills**: It improves communication skills
46. **Intellectual Engagement**: Writing engages you intellectually and keeps your mind active
47. **Personal Branding**: It helps in building a personal brand and reputation
48. **Community Building**: Writing helps in building and nurturing a community
49. **Empathy**: It fosters empathy by sharing personal experiences and perspectives
50. **Joy of Creation**: Writing brings the joy of creating something meaningful and valuable
