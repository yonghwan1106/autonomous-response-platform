'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

interface Building3DViewerProps {
  floors: number
  disasterFloor: number | null
  buildingName?: string
}

export default function Building3DViewer({
  floors,
  disasterFloor,
  buildingName = '재난 발생 건물'
}: Building3DViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Scene 설정
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1a1a2e)
    sceneRef.current = scene

    // Camera 설정
    const camera = new THREE.PerspectiveCamera(
      60,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    )
    camera.position.set(20, 15, 20)
    camera.lookAt(0, 0, 0)

    // Renderer 설정
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Controls 설정
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.minDistance = 10
    controls.maxDistance = 50
    controls.maxPolarAngle = Math.PI / 2

    // 조명
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(10, 20, 10)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    scene.add(directionalLight)

    // 바닥
    const groundGeometry = new THREE.PlaneGeometry(50, 50)
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d3436,
      roughness: 0.8
    })
    const ground = new THREE.Mesh(groundGeometry, groundMaterial)
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)

    // 건물 층 생성
    const floorHeight = 3
    const buildingWidth = 10
    const buildingDepth = 10

    for (let i = 0; i < floors; i++) {
      const isDisasterFloor = disasterFloor !== null && i + 1 === disasterFloor

      // 층 박스
      const floorGeometry = new THREE.BoxGeometry(buildingWidth, floorHeight - 0.1, buildingDepth)
      const floorMaterial = new THREE.MeshStandardMaterial({
        color: isDisasterFloor ? 0xff0000 : 0x3498db,
        emissive: isDisasterFloor ? 0xff0000 : 0x000000,
        emissiveIntensity: isDisasterFloor ? 0.5 : 0,
        transparent: true,
        opacity: isDisasterFloor ? 0.9 : 0.7,
        roughness: 0.5,
        metalness: 0.1
      })

      const floor = new THREE.Mesh(floorGeometry, floorMaterial)
      floor.position.y = (i * floorHeight) + (floorHeight / 2)
      floor.castShadow = true
      floor.receiveShadow = true
      scene.add(floor)

      // 층 테두리
      const edges = new THREE.EdgesGeometry(floorGeometry)
      const lineMaterial = new THREE.LineBasicMaterial({
        color: isDisasterFloor ? 0xffff00 : 0xffffff,
        linewidth: isDisasterFloor ? 3 : 1
      })
      const wireframe = new THREE.LineSegments(edges, lineMaterial)
      wireframe.position.copy(floor.position)
      scene.add(wireframe)

      // 재난 발생 층 표시
      if (isDisasterFloor) {
        // 화염 효과 (간단한 파티클)
        const particlesGeometry = new THREE.BufferGeometry()
        const particlesCount = 50
        const positions = new Float32Array(particlesCount * 3)

        for (let j = 0; j < particlesCount * 3; j++) {
          positions[j] = (Math.random() - 0.5) * buildingWidth * 0.8
        }

        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        const particlesMaterial = new THREE.PointsMaterial({
          color: 0xff6600,
          size: 0.3,
          transparent: true,
          opacity: 0.8
        })

        const particles = new THREE.Points(particlesGeometry, particlesMaterial)
        particles.position.y = floor.position.y
        scene.add(particles)

        // 파티클 애니메이션을 위한 참조 저장
        particles.userData.isFlame = true
      }

      // 층수 텍스트 (간단한 스프라이트로 표시)
      const canvas = document.createElement('canvas')
      canvas.width = 256
      canvas.height = 128
      const context = canvas.getContext('2d')
      if (context) {
        context.fillStyle = isDisasterFloor ? '#ff0000' : '#ffffff'
        context.font = 'Bold 64px Arial'
        context.textAlign = 'center'
        context.textBaseline = 'middle'
        context.fillText(`${i + 1}F`, 128, 64)
      }

      const texture = new THREE.CanvasTexture(canvas)
      const spriteMaterial = new THREE.SpriteMaterial({ map: texture })
      const sprite = new THREE.Sprite(spriteMaterial)
      sprite.position.set(buildingWidth / 2 + 2, floor.position.y, 0)
      sprite.scale.set(4, 2, 1)
      scene.add(sprite)
    }

    // 애니메이션
    let animationId: number
    const animate = () => {
      animationId = requestAnimationFrame(animate)

      // 화염 파티클 애니메이션
      scene.traverse((object) => {
        if (object.userData.isFlame && object instanceof THREE.Points) {
          const positions = object.geometry.attributes.position.array as Float32Array
          for (let i = 1; i < positions.length; i += 3) {
            positions[i] += 0.05 // 위로 상승
            if (positions[i] > floorHeight / 2) {
              positions[i] = -floorHeight / 2
            }
          }
          object.geometry.attributes.position.needsUpdate = true
          object.rotation.y += 0.01
        }
      })

      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    // 리사이즈 핸들러
    const handleResize = () => {
      if (!containerRef.current) return
      const width = containerRef.current.clientWidth
      const height = containerRef.current.clientHeight

      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }

    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationId)
      renderer.dispose()
      containerRef.current?.removeChild(renderer.domElement)
    }
  }, [floors, disasterFloor])

  return (
    <div className="w-full h-full">
      <div className="bg-gray-800 text-white px-4 py-2 flex items-center justify-between">
        <div>
          <h3 className="font-bold">{buildingName}</h3>
          <p className="text-xs text-gray-300">
            총 {floors}층 건물
            {disasterFloor && (
              <span className="ml-2 text-red-400 font-bold">
                🔥 {disasterFloor}층 재난 발생
              </span>
            )}
          </p>
        </div>
        <div className="text-xs text-gray-400">
          <p>🖱️ 드래그: 회전</p>
          <p>🖱️ 휠: 확대/축소</p>
        </div>
      </div>
      <div ref={containerRef} className="w-full" style={{ height: 'calc(100% - 60px)' }} />
    </div>
  )
}
