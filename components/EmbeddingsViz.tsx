'use client';

import { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import * as THREE from 'three';

interface ArticleData {
  id: string;
  postSlug: string;
  postTitle: string;
  content: string;
  chunkType: string;
  metadata: any;
  sequence: number;
  embedding: number[];
  publishedDate?: string;
  tags?: string[];
  createdAt: string;
  index: number;
}

interface EmbeddingsVizProps {
  className?: string;
}

export default function KnowledgeConstellation({ className = '' }: EmbeddingsVizProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const animationRef = useRef<number>();
  const [data, setData] = useState<ArticleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<ArticleData | null>(null);
  const { theme } = useTheme();

  // Fetch embeddings data
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching articles for constellation...');
        const response = await fetch('/api/embeddings');
        const result = await response.json();
        
        if (result.success) {
          setData(result.data);
          console.log(`Loaded ${result.data.length} articles for constellation`);
        } else {
          setError('Failed to fetch articles');
        }
      } catch (err) {
        setError('Error fetching articles');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current || data.length === 0) return;

    console.log('Creating knowledge constellation...');

    // Filter valid articles
    const validData = data.filter(article => 
      Array.isArray(article.embedding) && 
      article.embedding.length > 0 &&
      article.embedding.every(val => typeof val === 'number')
    );

    if (validData.length === 0) {
      setError('No valid articles found');
      return;
    }

    // Scene setup
    const scene = new THREE.Scene();
    const isDark = theme === 'dark';
    scene.background = new THREE.Color(isDark ? 0x000511 : 0x0a0a1a);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      2000
    );
    camera.position.set(0, 0, 100);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Add beautiful starfield background
    createStarfield(scene, 2000);

    // Create constellation layout
    const { positions, connections } = createConstellationLayout(validData);

    // Create article stars
    const stars: THREE.Mesh[] = [];
    const starData: ArticleData[] = [];

    validData.forEach((article, index) => {
      if (positions[index]) {
        const position = positions[index];
        
        // Create star with varying brightness
        const starSize = Math.min(Math.max(article.content.length / 2000, 0.3), 2);
        const geometry = new THREE.SphereGeometry(starSize, 16, 16);
        
        // Beautiful colors based on tags
        let starColor: THREE.Color;
        if (article.tags && article.tags.length > 0) {
          const tagHash = article.tags.join('').split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
          }, 0);
          const hue = Math.abs(tagHash) % 360;
          starColor = new THREE.Color().setHSL(hue / 360, 0.8, 0.7);
        } else {
          // Default beautiful blue for untagged articles
          starColor = new THREE.Color(0x4dabf7);
        }

        const material = new THREE.MeshPhongMaterial({ 
          color: starColor,
          emissive: starColor.clone().multiplyScalar(0.3),
          transparent: true,
          opacity: 0.9
        });
        
        const star = new THREE.Mesh(geometry, material);
        star.position.copy(position);
        star.userData.index = index; // Add index for click detection
        scene.add(star);
        stars.push(star);
        starData.push(article);
      }
    });

    // Add constellation connections
    connections.forEach(connection => {
      scene.add(connection);
    });

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1, 1000);
    pointLight.position.set(0, 0, 50);
    scene.add(pointLight);

    // Mouse controls
    let isMouseDown = false;
    let mouseX = 0, mouseY = 0;
    let targetRotationX = 0, targetRotationY = 0;
    let rotationX = 0, rotationY = 0;
    let targetZoom = 100; // Smooth zoom target

    const handleMouseDown = (event: MouseEvent) => {
      isMouseDown = true;
      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const handleMouseUp = () => {
      isMouseDown = false;
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!mountRef.current) return;

      if (isMouseDown) {
        const deltaX = event.clientX - mouseX;
        const deltaY = event.clientY - mouseY;
        
        targetRotationY += deltaX * 0.005;
        targetRotationX += deltaY * 0.005;
        
        mouseX = event.clientX;
        mouseY = event.clientY;
      }
    };

    const handleClick = (event: MouseEvent) => {
      if (!mountRef.current) return;

      const rect = mountRef.current.getBoundingClientRect();
      const mouse = new THREE.Vector2();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(stars);

      if (intersects.length > 0) {
        const clickedStar = intersects[0].object as THREE.Mesh;
        const index = clickedStar.userData.index;
        if (index !== undefined && starData[index]) {
          setSelectedArticle(starData[index]);
        }
      }
    };

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      targetZoom += event.deltaY * 0.5;
      targetZoom = Math.max(30, Math.min(300, targetZoom));
    };

    mountRef.current.addEventListener('mousedown', handleMouseDown);
    mountRef.current.addEventListener('mouseup', handleMouseUp);
    mountRef.current.addEventListener('mousemove', handleMouseMove);
    mountRef.current.addEventListener('click', handleClick);
    mountRef.current.addEventListener('wheel', handleWheel);

    // Animation loop
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      
      // Smooth rotation
      rotationX += (targetRotationX - rotationX) * 0.1;
      rotationY += (targetRotationY - rotationY) * 0.1;
      
      // Smooth zoom
      camera.position.z += (targetZoom - camera.position.z) * 0.1;
      
      // Apply rotation to scene
      scene.rotation.x = rotationX;
      scene.rotation.y = rotationY;
      
      // Animate stars with gentle pulsing
      stars.forEach((star, index) => {
        const pulse = 1 + Math.sin(Date.now() * 0.002 + index * 0.1) * 0.1;
        star.scale.setScalar(pulse);
      });
      
      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      if (!mountRef.current || !camera || !renderer) return;

      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (mountRef.current) {
        mountRef.current.removeEventListener('mousedown', handleMouseDown);
        mountRef.current.removeEventListener('mouseup', handleMouseUp);
        mountRef.current.removeEventListener('mousemove', handleMouseMove);
        mountRef.current.removeEventListener('click', handleClick);
        mountRef.current.removeEventListener('wheel', handleWheel);
      }
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [data, theme]);

  // Create beautiful starfield background
  function createStarfield(scene: THREE.Scene, count: number) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Random positions in a large sphere
      const radius = Math.random() * 800 + 200;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);
      
      // Subtle colors
      const brightness = Math.random() * 0.5 + 0.5;
      colors[i3] = brightness;
      colors[i3 + 1] = brightness;
      colors[i3 + 2] = brightness;
      
      sizes[i] = Math.random() * 2 + 0.5;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 2,
      vertexColors: true,
      transparent: true,
      opacity: 0.8
    });

    const starfield = new THREE.Points(geometry, material);
    scene.add(starfield);
  }

  // Create constellation layout
  function createConstellationLayout(articles: ArticleData[]): { positions: THREE.Vector3[], connections: THREE.Line[] } {
    const positions: THREE.Vector3[] = [];
    const connections: THREE.Line[] = [];
    
    // Group articles by tags to form constellations
    const tagGroups = new Map<string, ArticleData[]>();
    
    articles.forEach(article => {
      if (article.tags && article.tags.length > 0) {
        article.tags.forEach(tag => {
          if (!tagGroups.has(tag)) {
            tagGroups.set(tag, []);
          }
          tagGroups.get(tag)!.push(article);
        });
      } else {
        if (!tagGroups.has('untagged')) {
          tagGroups.set('untagged', []);
        }
        tagGroups.get('untagged')!.push(article);
      }
    });

    // Position constellations in space
    let constellationIndex = 0;
    const constellationPositions: THREE.Vector3[] = [];
    
    tagGroups.forEach((groupArticles, tag) => {
      if (groupArticles.length > 0) {
        // Position constellation center
        const center = new THREE.Vector3(
          (Math.random() - 0.5) * 400,
          (Math.random() - 0.5) * 400,
          (Math.random() - 0.5) * 400
        );
        constellationPositions.push(center);
        
        // Position articles within constellation
        groupArticles.forEach((article, articleIndex) => {
          const angle = (articleIndex / groupArticles.length) * Math.PI * 2;
          const radius = 15 + Math.random() * 10;
          const height = (Math.random() - 0.5) * 20;
          
          const x = center.x + Math.cos(angle) * radius;
          const y = center.y + height;
          const z = center.z + Math.sin(angle) * radius;
          
          positions.push(new THREE.Vector3(x, y, z));
        });
        
        constellationIndex++;
      }
    });

    // Create connections between related articles
    articles.forEach((article, i) => {
      articles.forEach((otherArticle, j) => {
        if (i !== j && i < j) { // Avoid duplicates
          // Calculate similarity
          const dotProduct = article.embedding.reduce((sum, val, k) => 
            sum + val * otherArticle.embedding[k], 0);
          const magnitudeA = Math.sqrt(article.embedding.reduce((sum, val) => sum + val * val, 0));
          const magnitudeB = Math.sqrt(otherArticle.embedding.reduce((sum, val) => sum + val * val, 0));
          const similarity = dotProduct / (magnitudeA * magnitudeB);
          
          if (similarity > 0.7) { // High similarity threshold
            const geometry = new THREE.BufferGeometry().setFromPoints([
              positions[i], positions[j]
            ]);
            const material = new THREE.LineBasicMaterial({ 
              color: 0x4dabf7, 
              transparent: true, 
              opacity: similarity * 0.3 
            });
            connections.push(new THREE.Line(geometry, material));
          }
        }
      });
    });

    return { positions, connections };
  }

  const handleReadArticle = (article: ArticleData) => {
    window.open(`/posts/${article.postSlug}`, '_blank');
  };

  const handleClosePopup = () => {
    setSelectedArticle(null);
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-light-accent dark:border-dark-accent mx-auto mb-4"></div>
          <p className="text-japanese-sumiiro dark:text-japanese-murasakisuishiyou">Illuminating your knowledge constellation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="text-center text-red-600 dark:text-red-400">
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div ref={mountRef} className="w-full h-full" />
      
      {/* Title */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 text-center">
        <h2 className="text-2xl font-bold text-white/90 mb-2">Knowledge Constellation</h2>
        <p className="text-white/70 text-sm">Each star represents an article in your knowledge universe</p>
      </div>

      {/* Controls */}
      <div className="absolute bottom-4 left-4 bg-black/30 text-white p-3 rounded-lg backdrop-blur-sm">
        <p className="text-sm">
          Drag to explore • Scroll to zoom • Click stars to read
        </p>
      </div>

      {/* Article Popup */}
      {selectedArticle && (
        <div className="absolute top-4 right-4 bg-white/95 dark:bg-gray-800/95 text-gray-900 dark:text-gray-100 p-6 rounded-lg backdrop-blur-sm max-w-md border border-gray-200 dark:border-gray-700 shadow-2xl">
          <div className="flex justify-between items-start mb-3">
            <h4 className="font-semibold text-xl pr-4">{selectedArticle.postTitle}</h4>
            <button
              onClick={handleClosePopup}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xl flex-shrink-0"
            >
              ×
            </button>
          </div>
          
          {selectedArticle.publishedDate && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Written: {new Date(selectedArticle.publishedDate).toLocaleDateString()}
            </p>
          )}
          
          {selectedArticle.tags && selectedArticle.tags.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-1">
                {selectedArticle.tags.map((tag, i) => (
                  <span key={i} className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {selectedArticle.content.length} characters • {selectedArticle.content.split(' ').length} words
          </p>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 italic">
            "{selectedArticle.content.substring(0, 200)}..."
          </p>
          
          <button
            onClick={() => handleReadArticle(selectedArticle)}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded transition-all duration-200 shadow-lg"
          >
            Read This Article →
          </button>
        </div>
      )}
    </div>
  );
}
