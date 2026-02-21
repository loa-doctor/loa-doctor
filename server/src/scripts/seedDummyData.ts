import 'dotenv/config'
import { connectMongo } from '../db/mongo.js'
import { Boss } from '../models/Boss.js'
import { Difficulty } from '../models/Difficulty.js'
import { Gate } from '../models/Gate.js'
import { PhaseGuide } from '../models/Phaseguide.js'
import mongoose from 'mongoose'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '../../.env');
dotenv.config({ path: envPath });

export const seedDummyData = async () => {
    await connectMongo()

    try {
        console.log('--- Wiping all existing raid data ---')
        await PhaseGuide.deleteMany({})
        await Gate.deleteMany({})
        await Difficulty.deleteMany({})
        await Boss.deleteMany({})
        console.log('Successfully wiped PhaseGuide, Gate, Difficulty, Boss collections.')

        const raidsToSeed = [
            // 1막 ~ 3막 (싱글, 노말, 하드)
            {
                name: '1막 : 대지를 부수는 업화의 궤적',
                shortName: '1막',
                category: '카제로스 레이드',
                difficulties: ['싱글', '노말', '하드'],
                gates: 2,
                gateMaxLines: [200, 270]
            },
            {
                name: '2막 : 부유하는 악몽의 진혼곡',
                shortName: '2막',
                category: '카제로스 레이드',
                difficulties: ['싱글', '노말', '하드'],
                gates: 2,
                gateMaxLines: [300, 420]
            },
            {
                name: '3막 : 칠흑, 폭풍의 밤',
                shortName: '3막',
                category: '카제로스 레이드',
                difficulties: ['싱글', '노말', '하드'],
                gates: 3,
                gateMaxLines: [0, 0, 0] // Dummy until known
            },
            // 4막, 종막 (노말, 하드)
            {
                name: '4막 : 파멸의 성채',
                shortName: '4막',
                category: '카제로스 레이드',
                difficulties: ['노말', '하드'],
                gates: 2,
                gateMaxLines: [0, 0] // Dummy until known
            },
            {
                name: '종막 : 최후의 날',
                shortName: '종막',
                category: '카제로스 레이드',
                difficulties: ['노말', '하드'],
                gates: 3,
                gateMaxLines: [1000, 1000, 1000]
            },
            // 세르카 (노말, 하드, 나이트메어)
            {
                name: '그림자 레이드 : 고통의 마녀, 세르카',
                shortName: '세르카',
                category: '그림자 레이드',
                difficulties: ['노말', '하드', '나이트메어'],
                gates: 2,
                gateMaxLines: [0, 0] // Dummy until known
            }
        ]

        console.log('--- Seeding Dummy Difficulty Structures ---')
        
        for (const raid of raidsToSeed) {
            const boss = await Boss.create({ 
                name: raid.name,
                shortName: raid.shortName,
                category: raid.category
            })
            console.log(`Created Boss: ${boss.name}`)

            let order = 1
            for (const diffName of raid.difficulties) {
                const difficulty = await Difficulty.create({
                    bossId: boss._id,
                    name: diffName,
                    order: order++
                })
                console.log(`  Created Difficulty: ${difficulty.name}`)

                let numGates = (raid as any).gates || 2;
                let gateMaxLines = (raid as any).gateMaxLines || Array(numGates).fill(0);
                
                if (raid.shortName === '종막') {
                    if (difficulty.name === '하드') {
                        numGates = 3;
                        gateMaxLines = [1000, 1000, 1000];
                    } else {
                        numGates = 2;
                        gateMaxLines = [1000, 1000];
                    }
                }

                const createdGateNames = []
                for (let i = 1; i <= numGates; i++) {
                    const maxL = gateMaxLines[i - 1] || 0;

                    let gateName = `${i}관문`
                    if (raid.shortName === '종막' && difficulty.name === '하드') {
                        if (i === 2) gateName = '2-1관문'
                        if (i === 3) gateName = '2-2관문'
                    }

                    const gate = await Gate.create({
                        difficultyId: difficulty._id,
                        gateNumber: i,
                        name: gateName,
                        maxLines: maxL 
                    })
                    createdGateNames.push(gate.name)

                    // 에기르(1막) 기믹 데이터 주입
                    if (raid.shortName === '1막') {
                        if (i === 1) {
                            if (difficulty.name === '싱글') {
                                const g1Single = [
                                    { line: 190, phase: '돌멩이 낙하', hint: '돌 그림자 피하기 -> 흡수 시 걸어서 탈출' },
                                    { line: 170, phase: '망자의 세계', hint: '낫 고의 피격(1파 좌 / 2파 우) -> 내부 분신 2개 무력 -> 본체 무력' },
                                    { line: 145, phase: '브레스', hint: '생성된 돌 뒤로 숨기' },
                                    { line: 115, phase: '쉴드 파괴', hint: '장판 회피 -> 발탄 카운터 -> 에스더(웨이/라하)' },
                                    { line: 87, phase: '능지 장판', hint: '장판 터지는 순서 암기 후 회피' },
                                    { line: 60, phase: '팔 파괴 및 저가', hint: '왼쪽 대기 -> 오른쪽 팔 파괴 -> 팔 다가올 때 저스트 가드(G) -> 무력' },
                                    { line: 30, phase: '중앙 무력', hint: '바닥 장판 피하며 본체 무력화' }
                                ]
                                for (const g of g1Single) {
                                    const formattedHint = g.hint.replace(/\s*->\s*/g, '\n-> ')
                                    await PhaseGuide.create({ gateId: gate._id, ...g, hint: formattedHint })
                                }
                            } else if (difficulty.name === '노말') {
                                const g1Normal = [
                                    { line: 200, phase: '돌 던지기', hint: '돌 그림자 회피 -> 일리아칸 등장(까꿍) 회피' },
                                    { line: 170, phase: '망자의 세계', hint: '무력 파티 고의 피격(내부 진입) -> 내부 분신 2개 무력화 -> 외부 본체 무력화' },
                                    { line: 143, phase: '브레스 및 첫 저가', hint: '생성된 돌 뒤로 숨기 -> 노란색 장판 끝까지 차면 저스트 가드(G)' },
                                    { line: 115, phase: '중앙 쉴드 파괴', hint: '일직선 잡기 장판 회피 -> 끝부분 카운터 -> 에스더(웨이/라하르트)' },
                                    { line: 87, phase: '능지 장판 및 왕손', hint: '장판 터지는 순서 암기 및 회피 -> 손 찍힌 후 다가오는 화염에 저스트 가드(G)' },
                                    { line: 60, phase: '팔 파괴 및 무력화', hint: '왼쪽 대기 -> 오른쪽 팔 파괴 -> 팔이 밀칠 때 저스트 가드(G) -> 본체 무력화' },
                                    { line: 30, phase: '중앙 본체 무력화', hint: '바닥 장판 피하며 중앙 본체 무력화' }
                                ]
                                for (const g of g1Normal) {
                                    const formattedHint = g.hint.replace(/\s*->\s*/g, '\n-> ')
                                    await PhaseGuide.create({ gateId: gate._id, ...g, hint: formattedHint })
                                }
                            } else if (difficulty.name === '하드') {
                                const g1Hard = [
                                    { line: 200, phase: '돌 던지기', hint: '돌 그림자 회피 -> 일리아칸 등장(까꿍) 회피' },
                                    { line: 170, phase: '망자의 세계', hint: '무력 파티 고의 피격(내부 진입) -> 내부 표식(진짜) 분신 무력화 -> 외부 본체 무력화' },
                                    { line: 143, phase: '브레스 및 첫 저가', hint: '생성된 돌 뒤로 숨기 -> 노란색 장판 끝까지 차면 저스트 가드(G)' },
                                    { line: 115, phase: '중앙 쉴드 파괴', hint: '일직선 잡기 장판 회피 -> 끝부분 연속 카운터 주의 -> 에스더(웨이/라하르트)' },
                                    { line: 87, phase: '능지 장판 및 왕손', hint: '장판 터지는 순서 암기 및 회피(피격 시 피증 주의) -> 손 찍힌 후 다가오는 화염에 저스트 가드(G)' },
                                    { line: 60, phase: '팔 파괴 및 무력화', hint: '왼쪽 대기 -> 오른쪽 팔 파괴 -> 팔이 밀칠 때 저스트 가드(G) -> 본체 무력화' },
                                    { line: 30, phase: '중앙 본체 무력화', hint: '바닥 장판 피하며 중앙 본체 무력화 (라하르트 추천)' }
                                ]
                                for (const g of g1Hard) {
                                    const formattedHint = g.hint.replace(/\s*->\s*/g, '\n-> ')
                                    await PhaseGuide.create({ gateId: gate._id, ...g, hint: formattedHint })
                                }
                            }
                        } else if (i === 2) {
                            if (difficulty.name === '싱글') {
                                const g2Single = [
                                    { line: 260, phase: '돌 파괴 및 저가', hint: '회전 레이저 회피 -> 돌 파괴 -> 창 찍기 직전 저스트 가드(G)' },
                                    { line: 250, phase: '직사각 맵', hint: '구석 피신(발차기) -> 주변 창 2개 무력 -> 본체 딜' },
                                    { line: 210, phase: '왜곡 공간', hint: '외곽 7번 이상 이탈 금지 -> 본체 중앙 이동 시 에스더(아제나)' },
                                    { line: 165, phase: '4방향 레이저', hint: '쉴드 파괴 -> 창 찍기 직전 저스트 가드(G)' },
                                    { line: 153, phase: '에아달린 기믹', hint: '에스더 에아달린 사용 -> 장판 안 딜 -> 2타 직전 재입력(폭발)' },
                                    { line: 95, phase: '히든 에아달린', hint: '실리안 대사 첫마디에 에아달린 사용 (기믹 스킵)' },
                                    { line: 0, phase: '마무리', hint: '중앙에 떨어지는 발(기절 유발) 피하며 처치' }
                                ]
                                for (const g of g2Single) {
                                    const formattedHint = g.hint.replace(/\s*->\s*/g, '\n-> ')
                                    await PhaseGuide.create({ gateId: gate._id, ...g, hint: formattedHint })
                                }
                            } else if (difficulty.name === '노말') {
                                const g2Normal = [
                                    { line: 260, phase: '심장 파괴 및 칼 기믹', hint: '외곽 4개/중앙 심장 파괴 -> 에기르 내려찍기 저스트 가드(G) -> 직사각 맵 구석 피신 -> 칼 3개 기믹 반복(15스택 제거)' },
                                    { line: 210, phase: '왜곡 공간 및 벽 파괴', hint: '외곽 7번 이상 이탈 금지 -> 1분 후 거대 벽 생성 -> 에스더(아델)로 벽 파괴 및 본체 타격' },
                                    { line: 165, phase: '레이저 무력 및 칼 기믹', hint: '4방향 레이저 무력화 -> 내려찍기 저스트 가드(G) -> 쉴드 파괴 및 심장 파괴 -> 직사각 맵 구석 피신 -> 칼 3개 기믹 반복(15스택 제거)' },
                                    { line: 96, phase: '낙사 지형 진입', hint: '컷신 후 실리안 대사 첫마디에 에스더(에아달린) 사용 -> 낙사 주의하며 마무리' }
                                ]
                                for (const g of g2Normal) {
                                    const formattedHint = g.hint.replace(/\s*->\s*/g, '\n-> ')
                                    await PhaseGuide.create({ gateId: gate._id, ...g, hint: formattedHint })
                                }
                            } else if (difficulty.name === '하드') {
                                const g2Hard = [
                                    { line: 260, phase: '심장 파괴 및 칼 기믹', hint: '외곽 4개 심장 파괴(톱날 카운터로 방향 전환) -> 중앙 심장 파괴 -> 에기르 내려찍기 저스트 가드(G) -> 직사각 맵 칼 3개 기믹 반복(15스택 제거)' },
                                    { line: 210, phase: '왜곡 공간 및 벽 파괴', hint: '외곽 7번 이상 이탈 금지 -> 1분 후 거대 벽 생성 -> 에스더(아델)로 벽 파괴' },
                                    { line: 165, phase: '레이저 무력 및 쉴드 파괴', hint: '4방향 레이저 무력화 -> 게이지 소멸 후 내려찍기 저스트 가드(G) -> 에스더(아델/에아달린)로 쉴드 및 심장 파괴 -> 칼 3개 기믹 반복(15스택 제거)' },
                                    { line: 96, phase: '낙사 지형 진입', hint: '컷신 후 실리안 대사 첫마디에 에스더(에아달린) -> 낙사 주의 및 강화된 짤패턴(왕발 등) 주의' },
                                    { line: 0, phase: '발악 패턴(블랙홀 공간)', hint: '진입 시 위쪽 구슬(블랙홀)에 창 집을 때 저스트 가드(G) -> 카운터 타격 -> 무작위 대상 레이저를 보스에게 유도 (※ 가드 실패자 감금은 레이저 유도 성공 후 해제할 것)'}
                                ]
                                for (const g of g2Hard) {
                                    const formattedHint = g.hint.replace(/\s*->\s*/g, '\n-> ')
                                    await PhaseGuide.create({ gateId: gate._id, ...g, hint: formattedHint })
                            }
                        }
                    }
                    } else if (raid.shortName === '2막') {
                        if (i === 1) {
                            if (difficulty.name === '노말') {
                                const g1Normal = [
                                    { line: 300, phase: '조우 시: 부위 파괴', hint: '부식 폭탄 및 파괴 스킬로 보스 파괴 (미파괴 시 얼음 파편 생성)' },
                                    { line: 240, phase: '빙벽 파괴', hint: '중앙 안전 구역 확인 및 대기 -> 나타난 빙벽 파괴하며 안전 구역 찾기(2회 반복, 2번째는 표식자가 어그로 빼주기) -> 보스 백스텝 후 협동 카운터' },
                                    { line: 180, phase: '타임어택 쉴드', hint: '1분 타이머 생성 -> 남은 시간 56초에 에스더(페데리코) 사용 -> 55초에 저스트 가드(G) -> 페데리코 추가타 및 극딜로 쉴드 파괴' },
                                    { line: 120, phase: '달리기 및 무력화', hint: '컷신 후 5시 방향으로 전원 이동 -> 빙벽 파괴 -> 보스의 얼음 파동이 끝난 후 접근하여 무력화 -> 원형 장판 저스트 가드(G)' },
                                    { line: 60, phase: '타임어택 쉴드', hint: '180줄과 동일하게 진행 (얼음 파편이 많을 경우, 60줄 진입 전 일부러 흡수시켜 부위 파괴를 유도한 뒤 진입 추천)' }
                                ]
                                for (const g of g1Normal) {
                                    const formattedHint = g.hint.replace(/\s*->\s*/g, '\n-> ')
                                    await PhaseGuide.create({ gateId: gate._id, ...g, hint: formattedHint })
                                }
                            } else if (difficulty.name === '싱글') {
                                const g1Single = [
                                    { line: 300, phase: '조우 시: 체온 관리 및 부위 파괴', hint: '화톳불에서 불꽃 스크롤 획득(체온 파란색 진입 시 사용) -> 부식 폭탄 또는 파괴 스킬로 보스 부위 파괴' },
                                    { line: 180, phase: '저가 및 쉴드 파괴', hint: '보스 기 모으기 시작 -> 저스트 가드(G) -> 에스더(페데리코) 사용하여 재생된 부위 파괴 및 쉴드 깎기' },
                                    { line: 120, phase: '맵 이동 및 무력화', hint: '컷신 후 1시 방향 길로 이동 (이동 중 체온 관리) -> 얼음벽 파괴 -> 보스의 중앙 냉기 뿜기 종료 후 접근하여 무력화' },
                                    { line: 60, phase: '저가 및 쉴드 파괴', hint: '180줄과 동일하게 보스 기 모으기 후 저스트 가드(G) -> 에스더(페데리코) 사용' }
                                ]
                                for (const g of g1Single) {
                                    const formattedHint = g.hint.replace(/\s*->\s*/g, '\n-> ')
                                    await PhaseGuide.create({ gateId: gate._id, ...g, hint: formattedHint })
                                }
                            } else {
                                // 2막 1관문 하드
                                const g1Hard = [
                                    { line: 300, phase: '조우 시: 부위 파괴 및 체온 관리', hint: '부식/파괴 스킬로 갑옷 3개 파괴 (미파괴 시 똥 장판 지속) -> 체온 50% 이하 진입 시 불꽃 스크롤 사용' },
                                    { line: 240, phase: '빙벽 파괴 및 카운터', hint: '빨간 화살표 방향 안전지대 얼음 파괴(3회 반복) -> 2, 3번째 표식자는 외곽에 브레스 유도 후 합류(합류 시 스크롤 사용 권장) -> 보스 백스텝 후 협동 카운터' },
                                    { line: 180, phase: '얼음 정산 (타임어택)', hint: '헤드 집결 -> 1분 타이머 시작 후 56초에 에스더(페데리코 1타+추가타) 사용하여 부메랑 스킵 및 갑옷 동시 파괴 -> 저스트 가드(G)' },
                                    { line: 120, phase: '맵 이동 및 석상 무력화', hint: '1시 방향 이동(얼음벽 앞 전원 대기 후 스크롤 사용) -> 1파티 위/2파티 아래 산개 -> 레이저 맞았을 때 디버프 쌓이는 진짜 기둥 2개 찾아서 몸으로 막기(15스택 교대) -> 중앙 보스 연속 무력화 2회 (에스더 에페르니아/아제나 사용)' },
                                    { line: 60, phase: '2차 얼음 정산 (타임어택)', hint: '180줄과 동일하게 진행 -> 헤드 집결 후 페데리코 및 초각성기 사용하여 쉴드 파괴' }
                                ]
                                for (const g of g1Hard) {
                                     const formattedHint = g.hint.replace(/\s*->\s*/g, '\n-> ')
                                     await PhaseGuide.create({ gateId: gate._id, ...g, hint: formattedHint })
                                }
                            }
                        } else if (i === 2) {
                            if (difficulty.name === '노말') {
                                const g2Normal = [
                                    { line: 420, phase: '조우 시: 시작 및 블랙홀', hint: '낫 3번 회피 후 저스트 가드(G) -> 주기적으로 블랙홀 생성 시 밀리지 않게 저항(이동/평타/스킬) -> 블랙홀 중앙을 바라보며 저스트 가드(G)' },
                                    { line: 337, phase: '프로켈 무력화 (2페 진입)', hint: '컷신 후 중앙 대기 -> 맵에 나타나는 프로켈 4회 무력화 -> 본체 체력바 아래 보라색 버프 소멸 시 본체 무력화' },
                                    { line: 148, phase: '2페 정산 (반정산/풀정산)', hint: '[반정산] 중앙 마법진 생성 -> 흰색 문양이 나타나는 순서대로 3번 회피\n[풀정산] 속박 스페이스바 미니게임 -> 바닥 건푸른 문양에 전원 모였다가 사라지면 빠지기 -> 떨어진 오브젝트 파괴 (에스더 니나브 사용 추천)' },
                                    { line: 147, phase: '프렌드 쉴드 (3페 진입)', hint: '곱3 / 곱3+1 위치 대기 -> 암흑 구체 평타로 부수며 시계 방향 이동 -> 내 디버프 33초 남았을 때 바깥으로 이동하여 동결 걸리기 -> 동결된 파티원 뒤에 숨기 (서폿은 마지막에 숨어 감금 해제 후 무력화)' },
                                    { line: 146, phase: '3페이지 수시 기믹 패턴', hint: '[유리 깨짐] 랜덤 안전 구역 생성 및 무차별 공격 -> 회피 집중 (서폿 각성기 추천)\n[길로틴 저가] 1, 5, 7, 11시 중 안전 구역(마지막 낫이 안 떨어진 곳)으로 1파티 좌 / 2파티 우 산개 이동 -> 딜러 1명 앞쪽 낫 저스트 가드(G)\n[풀정산 무력화] 곱3 방향 멀리 산개 -> 스페이스바 미니게임 -> 핑/디버프가 남아있는 진짜 보스 찾아가 무력화\n[위아래 저가] 보스 중앙 환영 생성 -> 전 맵의 노란색 빗살무늬가 다 지나가는 타이밍에 맞춰 저스트 가드(G)' }
                                ]
                                for (const g of g2Normal) {
                                    const formattedHint = g.hint.replace(/\s*->\s*/g, '\n-> ')
                                    await PhaseGuide.create({ gateId: gate._id, ...g, hint: formattedHint })
                                }
                            } else if (difficulty.name === '싱글') {
                                const g2Single = [
                                    { line: 420, phase: '조우 시: 시작 저가 및 블랙홀', hint: '세 번째 낫이 중간쯤 지나갈 때 저스트 가드(G) -> 주기적 블랙홀 생성 시 밀려나지 않게 저항 -> 마지막에 중앙 블랙홀 바라보고 저스트 가드(G)' },
                                    { line: 330, phase: '분신 무력화', hint: '미니맵 빨간 점으로 표시된 잡몹 찾아가서 3번 무력화 -> 중앙 본체 무력화 후 첫 번째 맵 이동' },
                                    { line: 148, phase: '첫 번째 맵 풀정산: 얼음 파괴', hint: '외곽 냉기 장판 피해 중앙 대기 -> 게이지 가득 차면 스페이스바 미니게임 -> 6시 대기 후 마법진 사라질 때 스페이스바 회피 -> 떨어진 얼음 파괴' },
                                    { line: 145, phase: '맵 외곽 회피', hint: '맵 외곽으로 이동하여 중앙 위험 구역 회피 -> 빨간 장판 피하며 생존 -> 컷신 후 동결 풀리면 중앙 본체 무력화 후 두 번째 맵 이동' },
                                    { line: 144, phase: '두 번째 맵 풀정산: 본체 무력화', hint: '맵 바깥쪽 위치 -> 캐릭터가 자동으로 안쪽 이동 시 스페이스바 미니게임 -> 미니맵에 표시된 보스 찾아가 무력화' },
                                    { line: 143, phase: '시간제 기믹: 낫 피하기', hint: '전 맵에 낫 투하 시 큰 낫 2개 확인 -> 큰 낫 2개와 수직 방향인 안전 구역(집결핑 위치)으로 이동하여 회피' }
                                ]
                                for (const g of g2Single) {
                                    const formattedHint = g.hint.replace(/\s*->\s*/g, '\n-> ')
                                    await PhaseGuide.create({ gateId: gate._id, ...g, hint: formattedHint })
                                }
                            } else {
                                // 2막 2관문 하드
                                const g2Hard = [
                                    { line: 420, phase: '조우 시: 시작 및 1페이지 특수 기믹', hint: '낫 3번 회피 후 조우 저스트 가드(G) -> [짤패턴] 프로켈 카운터 시 25초간 등장 억제 -> [1분 주기] 중앙 블랙홀 도넛 장판 터질 때 중앙 보며 저스트 가드(G) -> [낙인 운석] 바닥 장판 피격 시 낙인 생성, 짤패턴 2회 후 외곽에 운석 빼기' },
                                    { line: 335, phase: '프로켈 무력화 (2페이지 진입)', hint: '1파티 내부 / 2파티 외부(곱3+1) 대기 -> 외부 인원이 장판 3개 색상 기억 -> 내부에서 부르는 색상 장판 밟기 -> 내부 프로켈 3회 무력화 -> 4번째 장판 밟고 본체 무력화' },
                                    { line: 146, phase: '2페이지 정산 반복 (반정산/풀정산)', hint: '[반정산] 바닥 문양 확인 (흰색=정방향, 보라색=대각선 역방향)하여 4회 이동\n[풀정산] 외곽 강제 이동 후 스페이스바 미니게임 -> 낙인 4명 6시에 모여 검 꽂고 파괴 (2번째 풀정산은 에스더 니나브로 파괴)' },
                                    { line: 145, phase: '빙결 생존 (3페이지 진입)', hint: '1파티 곱3, 2파티 곱3+1 대기 -> 시계 방향으로 구슬 부수며 레이저 회피 -> 목적지(반대편) 도착 직전 외곽에서 빙결 2스택 쌓기 -> 목적지에서 완전 동결되어 즉사기 회피 (서폿 2명은 딜러 뒤 숨기) -> 감금 해제 후 중앙 무력화' },
                                    { line: 144, phase: '3페이지 정산 및 특수 패턴', hint: '[반정산] 큰 낫 2개가 안 떨어진 직선상 안전지대 대기 -> 날아오는 낫 1명 앞장서서 저스트 가드(G)\n[풀정산] 곱3 대기 -> 강제 이동 미니게임 -> 진짜 보스(사전 디버프/핑 표기) 찾아 무력화\n[문양 찾기] 조우 직후/3분 후 넓어진 맵에서 문양 안전지대 이동\n[낙사 빔] 두 번째 문양 찾기 40초 후 보스 백스텝 낙사 빔 회피 또는 피격 후 스페이스바 연타' },
                                    { line: 0, phase: '0줄 발악: 히든 아제나 및 교대 저가', hint: '6시 대기 후 장판 2회 터지면 진입 -> [풀정산(주기 3분30초 등)] 1파티 내부 저가(G), 2파티 외곽 피신 (다음 정산 시 교대) -> [2분 50초] 정산 게이지 흑백 전환 및 메두사 패턴 시 맵 바깥 바라보며 에스더(아제나) 사용' }
                                ]
                                for (const g of g2Hard) {
                                     const formattedHint = g.hint.replace(/\s*->\s*/g, '\n-> ')
                                     await PhaseGuide.create({ gateId: gate._id, ...g, hint: formattedHint })
                                }
                            }
                        }
                    } else if (raid.shortName === '3막') {
                        if (i === 1) { // 3막 1관문 (카멘)
                            if (difficulty.name === '싱글' || difficulty.name === '노말') {
                                const g1Normal = [
                                    { line: 280, phase: '능지 장판 및 찐무력화', hint: '보스 칼 방향 피하며 무력화 -> 빨간 장판 2번 피하고 이동 -> 찐무 게이지 깎기 (분신 칼 방향 반대로 피하기)' },
                                    { line: 200, phase: '카운터 및 히든 에스더', hint: '보스 돌진 시 카운터 -> 에스더(카마인) 사용하여 히든 발동 -> 미역 줄기 장판 사라지면 위로 진입' },
                                    { line: 50, phase: '저스트 가드 및 마무리', hint: '빨간 장판 피하고 아래로 이동 -> 원 장판 피하고 중앙 진입 -> 위쪽 방향 저스트 가드(G) -> 에스더(아자키엘) 사용 후 프리딜' }
                                ]
                                for (const g of g1Normal) {
                                     const formattedHint = g.hint.replace(/\s*->\s*/g, '\n-> ')
                                     await PhaseGuide.create({ gateId: gate._id, ...g, hint: formattedHint })
                                }
                            } else {
                                const g1Hard = [
                                    { line: 300, phase: '조우 반격', hint: '카멘 반격 자세 고의 타격 -> 전방 찌르기 회피 후 측면 대기 -> 저스트 가드(G)' },
                                    { line: 275, phase: '빨간 장판 및 찐무력화', hint: '일자 장판 2번 무빙 회피 -> 능지 장판 4번(생성 역순 폭발) 회피 -> 본체 무력화 -> 이후 찐무 게이지 깎기 (내부 진입 부채꼴 패턴 주의)' },
                                    { line: 274, phase: '찐무 직후: 균열 진입 및 달리기', hint: '균열 전원 진입 -> 끝까지 달리기 -> 능지 장판 회피 -> 저스트 가드(G) 후 바깥쪽 피신' },
                                    { line: 210, phase: '똥 빼기 및 협카 (히든 카마인)', hint: '랜덤 똥 외곽 배출 -> 카멘 협동 카운터 -> 에스더(카마인) 사용하여 히든 발동 -> 운석 낙하 주의' },
                                    { line: 209, phase: '운석 직후: 첫 번째 개인 저가', hint: '곱3+1 산개하여 개인 저스트 가드(G) -> 12시 안전지대 안개 걷히면 진입' },
                                    { line: 115, phase: '인페르나 폭격', hint: '바닥 장판 회피 -> 카멘 납치 찌르기 시전 시 확인 후 진입' },
                                    { line: 75, phase: '두 번째 개인 저가', hint: '전원 중앙 집결하여 딱 1명만 저스트 가드(G) -> 순간이동 카멘 카운터 타격' },
                                    { line: 50, phase: '최종 페이즈', hint: '컷신 후 바깥쪽 데미지 안개 주의하며 0줄 마무리' }
                                ]
                                for (const g of g1Hard) {
                                     const formattedHint = g.hint.replace(/\s*->\s*/g, '\n-> ')
                                     await PhaseGuide.create({ gateId: gate._id, ...g, hint: formattedHint })
                                }
                            }
                        } else if (i === 2) { // 3막 2관문 (나이트레아)
                            if (difficulty.name === '싱글' || difficulty.name === '노말') {
                                const g2Normal = [
                                    { line: 230, phase: '금/은 보호막', hint: '내 캐릭터 색상(금/은)에 맞춰 4번 장판 이동 (안/밖) -> 중앙 본체 무력화' },
                                    { line: 105, phase: '어그로 회피 및 중앙 무력화', hint: '보스 공격 회피하며 버티기 -> 중앙 보스 무력화 (3페이지 진입)' },
                                    { line: 104, phase: '기믹: 벨가 피자', hint: '6시 대기 -> 중앙 회오리가 도는 방향(좌/우)을 보고 해당 방향으로 3번 연속 이동' }
                                ]
                                for (const g of g2Normal) {
                                     const formattedHint = g.hint.replace(/\s*->\s*/g, '\n-> ')
                                     await PhaseGuide.create({ gateId: gate._id, ...g, hint: formattedHint })
                                }
                            } else {
                                const g2Hard = [
                                    { line: 251, phase: '조우 시: 1페이지 및 시간제 기믹', hint: '기생충 15스택 감염 주의 -> [1분 주기] 도넛 폭발 시 중앙 보며 저가(G)\n[시간제(게이지 반↓)] 곱3+1 산개 후 파도 대신 맞기 & 레이저 회피\n[시간제(게이지 반↑)] 금/은 표식자끼리 이어달리기 및 빨간 운석 회피' },
                                    { line: 250, phase: '금/은 보호막 및 능지 장판', hint: '내 색상 맞춰 장판 4번 회피 -> 무력화 후 붉은 구슬 파괴 -> 파란 구슬 획득(내 보호막 색과 밑장판이 다를 경우 필수) -> 저스트 가드(G)' },
                                    { line: 215, phase: '2페이지(요호) 진입', hint: '1페이지 패턴 + 요호 짤패턴 추가 -> 보스 원형 저스트 가드(G) 실패 시 20초 구미호 변신' },
                                    { line: 105, phase: '분신 진짜 찾기', hint: '화면 정상 인원(황금 장판) 핑 표기 -> 흑백 인원이 핑 위치 확인하여 레이저 안 쏘는 분신 카운터/저가 2회 수행 -> 본체 무력화' },
                                    { line: 10, phase: '3페이지(벨가) 진입', hint: '빛/어둠 권능 흭득(카운터) -> 재물 잡기 (검은 표식 중앙, 빨강 보스 유도)\n[피자] 검은 줄(방향 전환) / 보라 줄(페이크) 확인하여 회오리 방향으로 돌다가 검은 줄 위치에서 반대로 돌기' }
                                ]
                                for (const g of g2Hard) {
                                     const formattedHint = g.hint.replace(/\s*->\s*/g, '\n-> ')
                                     await PhaseGuide.create({ gateId: gate._id, ...g, hint: formattedHint })
                                }
                            }
                        } else if (i === 3) { // 3막 3관문 (모르둠)
                            if (difficulty.name === '싱글') {
                                const g3Single = [
                                    { line: 381, phase: '조우 시: 약점 파괴 열기', hint: '에스더 게이지 3칸 시 카운터 등장 -> 카운터 직후 에스더(바운트르) + 파괴탄 투척 (이후 백어택 고정 효과 획득)' },
                                    { line: 380, phase: '1결투', hint: '무력화 -> 초록 점 1개 위치 대기 -> 저스트 가드(G) 2번 -> 파란 점 3개 위치(집)로 도망 -> 보스 헤드 고정하며 회피' },
                                    { line: 325, phase: '중앙 진입', hint: '중앙 십자 폭발 후 중앙 안전지대 진입 (망치를 뒤로 3번 뺄 때 카운터 등장)' },
                                    { line: 324, phase: '이결투: 저가 3번', hint: '무력화 -> 보라 점 2개 위치 대기 -> 저스트 가드(G) 3번 (느림-빠름-빠름) -> 맵 잘린 후 중앙 대기' },
                                    { line: 323, phase: '삼결투: 저가 3번', hint: '무력화 -> 파란 점 3개 위치 대기 -> 저스트 가드(G) 3번 (빠름-빠름-느림) -> 맵 잘린 후 피면기 활용하여 생존' },
                                    { line: 322, phase: '막결투: 고의 실패 및 히든', hint: '무력화 -> 저스트 가드(G) 성공-성공-고의 실패 -> 실패 직후 망치 들어 올릴 때 에스더(바운트르) 사용하여 히든 발동 -> 망치 카운터' }
                                ]
                                for (const g of g3Single) {
                                     const formattedHint = g.hint.replace(/\s*->\s*/g, '\n-> ')
                                     await PhaseGuide.create({ gateId: gate._id, ...g, hint: formattedHint })
                                }
                            } else if (difficulty.name === '노말') {
                                const g3Normal = [
                                    { line: 376, phase: '조우 시: 속성 관리 및 약점 파괴', hint: '빨강/파랑 속성 균형 유지 -> 초반 카운터 성공 직후 에스더(바운트르) 사용하여 약점 파괴 (이후 백어택 고정)' },
                                    { line: 375, phase: '1차 결투 및 1지파 진입', hint: '결투자(칼 표식) 맵 구체로 레이저 유도 파괴 -> 보스 무력화 -> 저스트 가드(G) 2회 -> [1지파 진입] 헤드 정중앙 집결하여 생존 (바스티안 유지)' },
                                    { line: 325, phase: '구체 진입 및 구슬 먹기', hint: '감전 구체 내부 진입 -> 내 속성 구슬 획득' },
                                    { line: 250, phase: '2차 결투 및 2지파 진입', hint: '1차 결투와 동일 수행 -> [2지파 진입] 연속 카운터 및 유도 레이저(와이어 회피) 주의' },
                                    { line: 160, phase: '망치 파괴 및 뇌사 택틱', hint: '망치를 딜/바스티안으로 파괴 -> 무력화 후 지정 뇌사 자리 이동 -> 색상 불일치 시 중앙 흰 장판 밟아 변환 후 진입' },
                                    { line: 120, phase: '3차 결투 및 3지파 진입', hint: '1, 2차 결투와 동일 수행 -> [3지파 진입] 낙사 극도 주의 (망치 부메랑, 스윙 등은 피면기/와이어/시정으로 버티기)' },
                                    { line: 45, phase: '막결투 및 히든 바운트르', hint: '결투 기믹 수행 -> 저스트 가드(G) 1, 2회 성공 후 3번째 고의 실패 -> 실패 직후 망치 들어 올릴 때 에스더(히든 바운트르) 발동 -> 이후 카운터' },
                                    { line: 0, phase: '0줄 발악: 마무리', hint: '에스더(샨디 등) 사용하여 남은 체력 프리딜 마무리' }
                                ]
                                for (const g of g3Normal) {
                                     const formattedHint = g.hint.replace(/\s*->\s*/g, '\n-> ')
                                     await PhaseGuide.create({ gateId: gate._id, ...g, hint: formattedHint })
                                }
                            } else {
                                const g3Hard = [
                                    { line: 476, phase: '조우 시: 속성 관리', hint: '빨강 4 / 파랑 4 속성 유지 -> 변환 패턴(흰 장판) 활용하여 등가 교환 또는 숫자 맞추기' },
                                    { line: 475, phase: '회오리 및 장판 / 달리기', hint: '(475줄) 회오리 피하며 레이저 3회 회피 -> (450줄) 인코스 장판 4번 회피\n(425줄) 달리기하며 감전 줄넘기/장판 회피 및 구슬 획득\n(400줄) 장판 4회 회피 + 줄넘기 동시 수행' },
                                    { line: 375, phase: '1차 결투 및 1지파 진입', hint: '결투자 구체 레이저 유도 파괴 -> 절반 무력 대기 후 완무 -> 미니맵 구슬 위치 저가(G) 2회 -> [1지파] 헤드 정중앙 집결 생존' },
                                    { line: 325, phase: '구체 진입 및 연속 카운터', hint: '감전 구체 내부 진입 -> 내 속성 구슬 5스택 획득 -> (300줄) 연속 카운터 1, 2번째 무시 후 3번째 타격' },
                                    { line: 250, phase: '2차 결투 및 2지파 진입', hint: '1차 결투와 동일 수행 -> [2지파] 연속 카운터, 협카, 유도 레이저 패턴 추가' },
                                    { line: 200, phase: '구슬 지우기 및 4연속 장판', hint: '(200줄) 보라 패턴 후 구슬 지우기(빨강 와이어, 파랑 도보 교차)\n(180줄) 빨/왼/파/오 장판 3회 회피 후 4번째 장판 상하 반전' },
                                    { line: 160, phase: '망치 파괴 및 장판 똥 배출', hint: '바스티안 2타로 망치 파괴 -> 지정 뇌사 자리 이동 -> (140줄) 빨왼/파오 4연속 이동하며 외곽 똥 빼기' },
                                    { line: 120, phase: '3차 결투 및 3지파 기믹', hint: '1, 2차 결투와 동일 -> [3지파] 낙사 극도 주의\n[반복 패턴] 청기백기, 파도 4번, 슈퍼노바(3번째 타격 카운터)\n[막결투] 3번째 고의 실패 및 히든 바운트르' },
                                    { line: 0, phase: '0줄 발악: 쉴드 파괴', hint: '에스더 바스티안 2타 -> 레이저/장판 회피 -> 1명 지정 색 변환 -> 외곽 내 색 구슬 먹으며 쉴드 100% 깎기' }
                                ]
                                for (const g of g3Hard) {
                                     const formattedHint = g.hint.replace(/\s*->\s*/g, '\n-> ')
                                     await PhaseGuide.create({ gateId: gate._id, ...g, hint: formattedHint })
                                }
                            }
                        }
                    } else if (raid.shortName === '4막') {
                        if (i === 1) { // 4막 1관문 (에키드나)
                            if (difficulty.name === '노말') {
                                const g1Normal = [
                                    { line: 300, phase: '조우', hint: '빠르게 딜하여 280줄 진입' },
                                    { line: 280, phase: '스폰라이트 (분신 유도)', hint: '곱3+1 자리 2명씩 대기 -> 스폰라이트 대상자는 외곽 분신 유도(겹치면 전멸) -> 터지는 폭발 회피 (이후 주기적 등장)' },
                                    { line: 240, phase: '진짜 찾기', hint: '중앙 무력화(분신 폭발 주의) -> 그림자 확인(반듯=반대, 춤=따라가기) -> 그림자와 무기/모션 동일한 분신 바라보고 저스트 가드(G) -> 협동 카운터 (2회 반복)' },
                                    { line: 239, phase: '지하 진입: 뱀 회피', hint: '6시 대기 -> 뱀 나오는 것 보고 안전지대 이동 -> 협동 카운터' },
                                    { line: 150, phase: '쉴드 및 줄넘기', hint: '산개하여 꽃 밟아 피감 50스택 깎기 & 매혹 줄넘기 스페이스바 넘기 -> 스택 소진 시 에스더(니나브 2타)로 쉴드 파괴 -> 남은 쉴드는 매혹 걸리며 딜' },
                                    { line: 30, phase: '아브렐슈드 난입', hint: '아브렐슈드 400줄까지 딜 -> 중앙 무력화' }
                                ]
                                for (const g of g1Normal) {
                                     const formattedHint = g.hint.replace(/\s*->\s*/g, '\n-> ')
                                     await PhaseGuide.create({ gateId: gate._id, ...g, hint: formattedHint })
                                }
                            } else if (difficulty.name === '하드') {
                                const g1Hard = [
                                    { line: 300, phase: '조우', hint: '빠르게 딜하여 280줄 진입' },
                                    { line: 280, phase: '스폰라이트 (분신 유도)', hint: '곱3/곱3+1 자리 대기 -> 스폰라이트는 외곽 분신 유도(겹치면 전멸), 표식자는 시계방향 이동 후 똥 외곽 배출 -> 중앙 합류 (이후 주기적 등장)' },
                                    { line: 240, phase: '진짜 찾기', hint: '중앙 무력화 -> 그림자 확인(반듯=반대, 춤=따라가기) -> 동일 무기/모션 분신 바라보고 저스트 가드(G) -> 협동 카운터 (2회 반복)' },
                                    { line: 239, phase: '지하 진입: 뱀 회피', hint: '6시 대기 -> 뱀 나오는 곳 확인 후 이동 -> 협동 카운터' },
                                    { line: 150, phase: '쉴드 타임어택 (1분)', hint: '꽃 밟아 피감 80스택 깎기 & 줄넘기 회피 -> 스택 소진 시 에스더(니나브 2타) 타격 -> 초각성기/주력기 몰아서 1분 내 쉴드 파괴' },
                                    { line: 30, phase: '아브렐슈드 난입', hint: '아브렐슈드 400줄까지 딜 -> 중앙 무력화' }
                                ]
                                for (const g of g1Hard) {
                                     const formattedHint = g.hint.replace(/\s*->\s*/g, '\n-> ')
                                     await PhaseGuide.create({ gateId: gate._id, ...g, hint: formattedHint })
                                }
                            }
                        } else if (i === 2) { // 4막 2관문 (아르모체)
                            if (difficulty.name === '노말') {
                                const g2Normal = [
                                    { line: 450, phase: '조우', hint: '낙사 주의하며 중앙 점프 유도 후 딜' },
                                    { line: 420, phase: '방패 줍기', hint: '당구대 시점 -> 노란색 부메랑 경로에서 저스트 가드(G) -> 떨어진 방패 줍기(G) 후 보스에게 발사(Q) (2회 반복) -> 그로기 시 에스더(아제나)' },
                                    { line: 350, phase: '1차 무력화', hint: '6시 대기 후 무력화 -> 좌우/반대 찍기 및 지진 줄넘기 회피 -> 풍차 시 아래로 이동 -> 병사 부수며 무력화 (에스더 바운트르 사용)' },
                                    { line: 280, phase: '좁아진 맵 (병사 탑승)', hint: '아래쪽 안전지대 이동 -> 돌진 회피 -> 협동 카운터 -> 양옆 노란 병사 파괴 후 자리당 1명 탑승 -> 보스 쫓아가 무력화' },
                                    { line: 240, phase: '협동 저가 및 파괴', hint: '보스 앞 집결 -> 장판 차기 직전 협동 저스트 가드(G) -> 파괴 스킬 사용(실리안 1타) -> 방패 소리 후 튕겨내면 거리 벌리기 (반복)' },
                                    { line: 150, phase: '방패벽 및 유도 창', hint: '유도 창 회피 -> 화산 분화구로 창 유도 파괴 -> 방패 주변 빨간 줄 생성 시 에스더(히든 바운트르) 사용하여 쉴드 파괴' },
                                    { line: 120, phase: '원형 장판 좁아짐', hint: '좁아진 곳 대기 -> 보스 찍기 피격 시 와이어(A 연타) 복귀 -> 돌무더기 파괴 후 딜' },
                                    { line: 50, phase: '돌 뒤 숨기', hint: '랜덤 인원 발밑 넉백 가시 3번 외곽에 빼기 -> 돌 뒤로 숨기 -> 0줄 마무리' }
                                ]
                                for (const g of g2Normal) {
                                     const formattedHint = g.hint.replace(/\s*->\s*/g, '\n-> ')
                                     await PhaseGuide.create({ gateId: gate._id, ...g, hint: formattedHint })
                                }
                            } else if (difficulty.name === '하드') {
                                const g2Hard = [
                                    { line: 450, phase: '조우', hint: '중앙 점프 유도 후 낙사 주의하며 빡딜' },
                                    { line: 420, phase: '방패 줍기', hint: '당구대 시점 -> 큰 노란색 부메랑 경로에서 저스트 가드(G) -> 방패 줍기(G) 후 발사(Q) (2회 반복) -> 그로기 시 에스더(아제나) (파란 구슬로 출혈 해제)' },
                                    { line: 360, phase: '1차 무력화', hint: '6시 집결 무력화 -> 지진 줄넘기 회피 -> 풍차 시 하단 이동 -> 병사 처치 및 찌르기/베기 회피하며 무력화 (에스더 바운트르 1타+2타)' },
                                    { line: 280, phase: '좁아진 맵 (병사 탑승)', hint: '하단 안전지대 이동 -> 돌진 회피 -> 협동 카운터(기절 부메랑 주의) -> 노란 병사 파괴 후 자리당 1명 탑승 -> 보스 무력화' },
                                    { line: 240, phase: '협동 저가 및 파괴', hint: '보스 앞 집결 -> 모션 보고 저스트 가드(G) (장판 안 보임) -> 파괴 스킬(실리안 1타) -> 방패 튕겨내면 거리 벌리기 (방패 파괴 후 강화 짤패턴 돌입)' },
                                    { line: 150, phase: '방패벽 및 유도 창', hint: '유도 창 회피 -> 화산 분화구로 창 유도 파괴 -> 방패 주변 빨간 줄 생성 시 에스더(히든 바운트르)로 쉴드 파괴' },
                                    { line: 120, phase: '맵 좁아짐 및 와이어', hint: '중앙 집결 -> 피격 후 와이어(A 연타) 복귀 -> 돌무더기 파괴 (아제나 활용)' },
                                    { line: 50, phase: '돌 뒤 숨기', hint: '넉백 가시 3번 외곽에 빼기 -> 돌 뒤 숨기 -> 강화 짤패턴 주의하며 0줄 마무리' }
                                ]
                                for (const g of g2Hard) {
                                     const formattedHint = g.hint.replace(/\s*->\s*/g, '\n-> ')
                                     await PhaseGuide.create({ gateId: gate._id, ...g, hint: formattedHint })
                                }
                            }
                        }
                    } else if (raid.shortName === '종막') {
                        if (i === 1) { // 종막 1관문
                            if (difficulty.name === '노말') {
                                const g1Normal = [
                                    { line: 950, phase: '조우 시: 정산 게이지', hint: '4칸이 찰 때마다 랜덤 정산 1회 시전(쇠사슬, 카운터, X자) -> 풀정산 시 이전 3개 연속 시전' },
                                    { line: 900, phase: '염동 패턴', hint: '구슬 피격 시 공중 부양 -> 보스 카운터 타격하여 구출 (카운터 후 똥장판 외곽 배출)\n주변 염동 구슬 발생 시 서폿/워로드가 유도하여 외곽 배출(염동 장판 생성)\n보스 손에 염동 구슬 들면 프리딜 타임' },
                                    { line: 700, phase: '내부 무력화 (턴제)', hint: '각자 내부 진입하여 본인 무력화 수행 -> 카운터 전조(백스텝 후 낮춤 또는 창 돌리기) 파악하여 카운터 타격 (무력 피해 증가) -> 약 40초 후 일자 즉사 장판 회피 -> 무력 성공 후 가장 짧은 줄 끝으로 이동하여 생존' },
                                    { line: 660, phase: '1차 격돌 (지하 진입)', hint: '1, 5, 7, 11시 중 보스 백헤드 표시 확인하여 이동 -> G키 격돌 진입 후 Q 연타' },
                                    { line: 500, phase: '쉴드 파괴', hint: '쉴드 560억 생성 -> 에스더(니나브 2타)로 300억 삭감 후 남은 쉴드 초각성기로 파괴' },
                                    { line: 380, phase: '바닥 저가 및 2차 격돌', hint: '바닥 찍는 저스트 가드(G) 필수 성공 -> 12시 2차 격돌 (에스더 웨이 사용하여 히든 격돌 대행 추천)' },
                                    { line: 300, phase: '강화 정산 및 반정산 (지상 복귀)', hint: '[반정산] 큰 빨간 장판 스페이스바 연타 탈출\n[풀정산] 외곽 똥 빼기 -> 줄넘기 회피 -> 표식자 지정 후 5연속 저스트 가드(G) 실패 없이 수행 -> 마지막 카운터 타격하여 암흑 해제 (표식자가 타격 필수) -> 즉사 장판 2번 연속 회피' }
                                ]
                                for (const g of g1Normal) {
                                     const formattedHint = g.hint.replace(/\s*->\s*/g, '\n-> ')
                                     await PhaseGuide.create({ gateId: gate._id, ...g, hint: formattedHint })
                                }
                            } else if (difficulty.name === '하드') {
                                const g1Hard = [
                                    { line: 950, phase: '조우 시: 번개 스파크', hint: '창 돌리며 꽂을 때 스파크 발생 -> 머리 위 회오리 및 발밑 번개 장판 동시 회피 (둘 다 피격 시 대폭발 디버프 발생, 외곽 격리)' },
                                    { line: 900, phase: '염동 패턴', hint: '구슬 피격 시 공중 부양 -> 보스 카운터 타격하여 구출 (카운터 후 똥장판 외곽 배출)\n주변 염동 구슬 발생 시 서폿/워로드가 유도하여 외곽 배출(염동 장판 생성)' },
                                    { line: 700, phase: '내부 무력화 및 즉사 장판', hint: '개인 무력화 진행 중 즉사급 별장판(밖으로 회피) 및 원장판(안으로 회피) 생성 주의 -> 카운터 타격 (무력 피해 증가)' },
                                    { line: 661, phase: '흑백 맵 무력화 (지하 얼염)', hint: '화면 흑백 전환 시 보스 밀착하여 무력화 (서폿 빡케어) -> 무력 실패 시 바닥 안개 소멸 타이밍 맞춰 저스트 가드(G)' },
                                    { line: 660, phase: '1차 격돌 (지하 진입)', hint: '1, 5, 7, 11시 중 보스 백헤드 표시 확인하여 이동 -> G키 격돌 진입 후 Q 연타' },
                                    { line: 500, phase: '쉴드 파괴', hint: '에스더(니나브 2타) 사용 후 남은 쉴드 초각성기로 밀기 필수' },
                                    { line: 380, phase: '바닥 저가 및 2차 격돌', hint: '바닥 찍는 저스트 가드(G) 필수 성공 -> 12시 2차 격돌 (에스더 웨이 대행 추천)' },
                                    { line: 300, phase: '지상 복귀 및 풀정산', hint: '컷신 후 피자 회피 -> 개인 똥 맵 끝에 빼고 스페이스바로 복귀 -> 표식자 보스 앞 5연속 저스트 가드(G) (타이밍: 바닥 하얀 똥 5번째 카운팅 시) -> 카운터 타격 후 즉사 장판 회피' },
                                    { line: 100, phase: '2인 교대 저가', hint: '노란 디버프(저가 불가) 부여 -> 노란 구슬 2개 생성 시 2명이 획득하여 디버프 해제 -> 작은 원장판 집결 -> 구슬 먹은 1번 유저가 맨 앞장서서 저스트 가드(G) -> 성공 후 2번 유저가 맨 앞장서서 저스트 가드(G) (실패 시 시정/서폿 초각 대처)' }
                                ]
                                for (const g of g1Hard) {
                                     const formattedHint = g.hint.replace(/\s*->\s*/g, '\n-> ')
                                     await PhaseGuide.create({ gateId: gate._id, ...g, hint: formattedHint })
                                }
                            }
                        } else if (i === 2) { // 종막 2-1관문
                            if (difficulty.name === '노말') {
                                const g2Normal = [
                                    { line: 955, phase: '조우 시: 목표 설정', hint: '900줄 이전에 1차 정산, 700줄 이전에 2차 정산 안 보는 것을 목표로 빡딜 (정산 게이지 밀기) -> 시작 직후 백으로 이동하여 거울 패턴 회피' },
                                    { line: 950, phase: '강제 격돌', hint: '화면 어두워진 랜덤 1명이 강제 격돌 진입 (Q 연타) -> 나머지 인원 딜' },
                                    { line: 900, phase: '검은 구름 및 벽 부수기', hint: '파란 기절 장판 버티기 -> 컷신 후 보스 주위 벽 생성 -> 부채꼴 어그로를 3/9시 유도하여 벽 부수기 -> 보스 승천 후 내려올 때 반대쪽 벽 부수기 -> 작은 원(밖) 후 큰 원(안) 회피' },
                                    { line: 700, phase: '무력화 및 12시 지형 파괴', hint: '보스 중앙 이동 시 기절 장판 회피 후 무력화 -> 성공 즉시 밖 피신 -> 12시 파괴 컷신 시청 후 600줄 딜' },
                                    { line: 600, phase: '붉은 갈기 및 기믹 폭풍', hint: '맵 멀어지며 붉은 칼날 회피(서폿 각성기) -> 보스 좌/우 벽 밀착 후 펀치 (피격자 펀치 시 카운터)' },
                                    { line: 599, phase: '무무격카 1사이클', hint: '헤드 밀착 무력 -> 도넛 후 2차 무력 -> 헤드 쪽 G키 격돌' },
                                    { line: 598, phase: '장풍 유도 날먹', hint: '보스 벽 밀착 시 카운터 타격 -> 장풍 어그로를 아랫쪽 허공으로 빼기 (돌 부수기 스킵)' },
                                    { line: 597, phase: '무무격카 2사이클', hint: '헤드 밀착 무력 -> 도넛 장판 후 2차 무력 -> 헤드 격돌' },
                                    { line: 596, phase: '돌 부수기 및 승천', hint: '보스 벽 밀착 시 카운터 타격 -> 장풍으로 12시 돌 부수기 -> 중앙 회오리 장판 밟고 승천 -> 칼날 공격 끝난 후 A키 복귀 -> 맵 추가 파괴 후 격돌 -> 저가(G) 후 와이어 액션 사막 진입' },
                                    { line: 595, phase: '사막: 어깨빵 저가 및 협카', hint: '돌진 대상자 저가(G) -> 전원 중앙 집결 후 빨간 원 장판 회피 -> 협동 카운터 (성공 즉시 에스더 카단) -> 보스 나타나는 방향 조준 저가(G) 2회' },
                                    { line: 594, phase: '사막: 지형 소멸 및 와이어', hint: '백스텝 3번 시 헤드 쪽 소멸 레이저 (백 피신) -> 또 백스텝 시 소멸 지역 근처로 집결 -> 안쪽 안전 원 피격 후 에어본 시 와이어(A) 복귀 -> 직선 회피' },
                                    { line: 0, phase: '사막 발악: 방향 딜 및 마무리', hint: '바운트르 대사 후 맵 파괴 -> 세 방향 빨간 장판 쪽을 바라보며 딜 넣어 게이지 소거 -> 지형 복구 후 승천 즉사 원 회피 -> 어깨빵 저가 패턴부터 반복하며 0줄 마무리' }
                                ]
                                for (const g of g2Normal) {
                                     const formattedHint = g.hint.replace(/\s*->\s*/g, '\n-> ')
                                     await PhaseGuide.create({ gateId: gate._id, ...g, hint: formattedHint })
                                }
                            } else if (difficulty.name === '하드') {
                                const g2_1Hard = [
                                    { line: 999, phase: '[2-1관문] 조우 시', hint: '50초 내 900줄 밀기 -> (실패 시 복잡한 정산 기믹 등장)' },
                                    { line: 950, phase: '[2-1관문] 강제 격돌', hint: '랜덤 1명 격돌 수행' },
                                    { line: 900, phase: '[2-1관문] 기절 장판 및 1차 딜타임', hint: '서폿 각성기/빛성부 활용하여 기절 장판 버티며 딜\n[돌벽 부수기] 3/9시 벽 부수기 -> 하늘에서 내려와 진짜 펀치(검푸른 아우라) 시 벽 부수기 -> 가짜 펀치(하얀 아우라) 시 부서진 벽 끝 피신 후 장판 배출' },
                                    { line: 899, phase: '[2-1관문] 블랙홀 및 돌진 유도', hint: '보스 펀치 반대 방향 + 백 방향 이동 -> 빨간 눈 어글자가 맵 끝 유도 후 돌진 시 스페이스바 회피 -> 밀착하여 생긴 끄트머리 안전 구역에서 프리딜' },
                                    { line: 898, phase: '[2-1관문] 강제 저가 및 반갈죽 무력화', hint: '강제 중앙 흡수 후 1명 연속 저가(G) -> 무력화(실패 시 넓게 터짐) -> 맵 반갈죽 후 12시 모여 기절 장판 피하고 무력화 -> 어그로 3/9시 유도 -> 거대 호두 끌어당기기 피신' },
                                    { line: 897, phase: '[2-1관문] 컷신 후', hint: '무무격카 반복: 헤드 밀착 무력 -> 2차 무력 -> 격돌 -> 카운터\n[별/회오리] 중앙 밟고 승천 -> 칼날 종료 직후 A키 착지\n[저가 2연속] 저가(G) 후 A키 2회' },
                                    { line: 896, phase: '[2-1관문] 사막 진입 및 프리딜', hint: '즉사 장판 회피 -> 헤드 밀착자 격돌\n[어깨빵 저가] 중앙 집결 회피 후 산개 -> 저가(G) -> 중앙 장판 터질 때 진입 후 협카\n[프리딜] 에스더(이난나 2번) 사용하여 프리딜' }
                                ]
                                for (const g of g2_1Hard) {
                                     const formattedHint = g.hint.replace(/\s*->\s*/g, '\n-> ')
                                     await PhaseGuide.create({ gateId: gate._id, ...g, hint: formattedHint })
                                }
                            }
                        } else if (i === 3) { // 종막 2-2/2-3관문
                            if (difficulty.name === '노말') {
                                const dummyPhaseData = [
                                    { line: 900, phase: '노말 기믹 업데이트 대기', hint: '아직 2-2관문 노말 기믹이 업데이트되지 않았습니다.' }
                                ]
                                for (const g of dummyPhaseData) {
                                     await PhaseGuide.create({ gateId: gate._id, ...g, hint: g.hint })
                                }
                            } else if (difficulty.name === '하드') {
                                const g2_2Hard = [
                                    { line: 895, phase: '[2-2관문] 조우 및 풀정산', hint: '서폿 각성기 상시 온존\n[풀정산] 중앙 집결 -> 빨강/파랑 선 연결 -> 연결 1명씩 노란 표식 변경 -> 노란 표식 선 연결 -> 남은 1명이 12시 화살 유도 -> 전원 저가(G)' },
                                    { line: 894, phase: '[2-2관문] 시간 기믹: 앵그리버드', hint: '[2분 주기] 염동력 부양 -> 드래그로 홈(안전 4개) 착지 -> 착지 후 보스 칼날 회피 및 저가(G)' },
                                    { line: 600, phase: '[2-2관문] 조종/굴복 (녹카/검카)', hint: '마지막 몸 색상(노란/검푸른) 확인 -> 장판 색상 동일 시 카운터, 다르면 백 회피\n[카카저카저카] 카/카/저/카/저/협카 수행' },
                                    { line: 500, phase: '[2-2관문] 타임어택 딜 체크', hint: '게이지 딜로 삭감 -> 에스더(아만 2타) 명중' },
                                    { line: 300, phase: '[2-2관문] 파도 및 행성 저가', hint: '피자 회피 후 무력화(1시->7시) -> 행성 2융합 시 저가(G) (각성기 추천) -> 시간 역전 -> 7시 파도 회피 후 1시 무력 및 쉴드 파괴' },
                                    { line: 290, phase: '[2-3관문] 재물 전 기믹', hint: '진입 에스더(공허 아만)\n[시간 스포트라이트] 표식자 보스와 카/저가 (4번 반복)\n[타임어택] 게이지 딜 삭감' },
                                    { line: 20, phase: '[2-3관문] 재물 기믹', hint: '광폭화 20초 전 진입 필수 -> 재물 1명 진입 후 목졸림 대기 -> 나머지 인원 피자 회피/저가 수행하며 무력화 (협카 시 쿨초)' },
                                    { line: 0, phase: '[2-3관문] 0줄 발악', hint: '에버그레이스 가호: 모든 스킬 리셋 최강 딜 -> 전멸 후 부활 시 화면 밝아질 때 에스더(히든 아만) 사용' }
                                ]
                                for (const g of g2_2Hard) {
                                     const formattedHint = g.hint.replace(/\s*->\s*/g, '\n-> ')
                                     await PhaseGuide.create({ gateId: gate._id, ...g, hint: formattedHint })
                                }
                            }
                        }
                    } else if (raid.shortName === '세르카') {
                        // 세르카 노말 & 하드 데이터 공통
                        if (difficulty.name === '노말' || difficulty.name === '하드') {
                            if (i === 1) { // 1관문
                                const g1Data = [
                                    { line: 270, phase: '못 박기 저스트 가드', hint: '안전지대(가시 장판 없는 곳)로 1칸씩 이동 -> 4회 연속 망치 내려칠 때 저스트 가드(G) (노란 가시 장판이 맵 끝까지 차오르는 타이밍)' },
                                    { line: 240, phase: '아이언 메이든', hint: '보스 빗자루 타고 맵 끝 이동 -> 바깥으로 완전히 빠져서 잡기 회피 -> (인원 잡힐 경우) 보스가 다가가기 전 본체 무력화하여 구출' },
                                    { line: 200, phase: '빗자루 피자', hint: '빗자루 투척 후 매우 넓은 범위 저스트 가드(G) -> 빗자루와 보스가 있는 방향의 안전 구역(피자)으로 이동' },
                                    { line: 100, phase: '대난투 (1칸 달성 시)', hint: '딜 누적하여 게이지 1칸 달성 -> 좌/우 화살표 지나간 방향 확인 후 느린 엇박자 저스트 가드(G) -> 곧이어 찍기 저스트 가드(G)' }
                                ]
                                for (const g of g1Data) {
                                    const formattedHint = g.hint.replace(/\s*->\s*/g, '\n-> ')
                                    await PhaseGuide.create({ gateId: gate._id, ...g, hint: formattedHint })
                                }
                            } else if (i === 2) { // 2관문
                                const g2Data = [
                                    { line: 999, phase: '[상시] 간파 시스템', hint: '보스의 특정 공격 타이밍에 맞춰 스페이스바로 패링(간파) -> 성공 시 무력화 증가 및 안전 구역/카운터 전조 확인 가능' },
                                    { line: 285, phase: '간파 및 무력화', hint: '보스 날개짓 후 공중에서 삼각형 타격 -> 보스 내려찍을 때 스페이스바 간파 -> 벨가누스 장판 시작 시 무력화 스킬 넣으며 회전' },
                                    { line: 240, phase: '가짜 분신 및 내부 무력화', hint: '가짜 분신 검 높이 확인 (검 높으면 반시계, 낮으면 시계 방향 안전지대 이동) -> 지름을 지나는 십자 직선 구역 회피 -> 본체 저스트 가드(G) 성공 후 내부 진입하여 무력화 (10초 추방 주기마다 입장 저가로 3번까지 재진입 가능)' },
                                    { line: 195, phase: '저저카저', hint: '백스텝 후 날려버리기 회피 -> 전방 빠른 저스트 가드(G) 2회 -> 전방 연속 찍기 후 큰 찍기 회피 -> 즉시 카운터 타격 -> 느린 저스트 가드(G)' },
                                    { line: 120, phase: '본체 찾기', hint: '다수의 분신 중 진짜 보스 판별하여 대응' },
                                    { line: 60, phase: '삼각 김밥 및 대난투 2차', hint: '맵에 생성되는 삼각 모양의 지정 안전 구역으로 이동\n[대난투 2칸 달성 시] 1관문(좌/우 화살표 엇박 + 찍기 저가) 패턴 수행 후 -> 정면 저스트 가드(G) 2회 연속 추가 수행' }
                                ]
                                for (const g of g2Data) {
                                    const formattedHint = g.hint.replace(/\s*->\s*/g, '\n-> ')
                                    await PhaseGuide.create({ gateId: gate._id, ...g, hint: formattedHint })
                                }
                            }
                        } else if (difficulty.name === '나이트메어') {
                            if (i === 1) { // 1관문 나이트메어
                                const g1Nightmare = [
                                    { line: 999, phase: '[상시 짤패턴] 즉사기 3종', hint: '큰 잔상, 순간이동, 낫 돌리기 등 짤패턴 피격 시 즉사급 데미지' },
                                    { line: 270, phase: '가시 폭탄 및 못 박기', hint: '못 박기 패턴 시작과 동시에 랜덤 1인에게 가시 폭탄 지정 -> 외곽에 배출 후 안전지대 합류\n[못 박기 저가] 안전지대로 1칸씩 이동 -> 4회 연속 망치 내려칠 때 저스트 가드(G)' },
                                    { line: 240, phase: '아이언 메이든', hint: '보스 빗자루 타고 맵 끝 이동 -> 바깥으로 완전히 빠져서 잡기 회피 -> (인원 잡힐 경우) 보스가 다가가기 전 본체 무력화하여 구출' },
                                    { line: 200, phase: '빗자루 피자', hint: '빗자루 투척 후 매우 넓은 범위 저스트 가드(G) -> 빗자루와 보스가 있는 방향의 안전 구역(피자)으로 이동' },
                                    { line: 100, phase: '대난투 (1칸 달성 시)', hint: '딜 누적하여 게이지 1칸 달성 -> 좌/우 화살표 지나간 방향 확인 후 느린 엇박자 저스트 가드(G) -> 곧이어 찍기 저스트 가드(G)' }
                                ]
                                for (const g of g1Nightmare) {
                                    const formattedHint = g.hint.replace(/\s*->\s*/g, '\n-> ')
                                    await PhaseGuide.create({ gateId: gate._id, ...g, hint: formattedHint })
                                }
                            } else if (i === 2) { // 2관문 나이트메어
                                const g2Nightmare = [
                                    { line: 999, phase: '[상시] 간파 시스템 (기본)', hint: '보스의 특정 공격 타이밍에 맞춰 스페이스바로 패링(간파) -> 기믹 파훼' },
                                    { line: 998, phase: '[상시] 나무 덩쿨 짤패턴', hint: '피격 시 무력화 등 기믹 방해 요소 추가 주의' },
                                    { line: 997, phase: '[상시] 까마귀 2종 짤패턴', hint: '제자리 까마귀: 휘두른 날개의 반대편이 안전\n백스텝 까마귀: 보스 헤드 기준 7시 방향이 안전' },
                                    { line: 996, phase: '[상시] 간파 4종 짤패턴', hint: '날개 카운터 간파 / 날개 승천 안전 구역 간파 / 검 카운터 간파 / 검 반격(짭찐짭) 간파 추가 (실패 시 매우 치명적)' },
                                    { line: 285, phase: '간파 및 무력화', hint: '보스 날개짓 후 공중에서 삼각형 타격 -> 보스 내려찍을 때 스페이스바 간파 -> 벨가누스 장판 시작 시 무력화 스킬 넣으며 회전' },
                                    { line: 240, phase: '가짜 분신 및 내부 무력화', hint: '가짜 분신 검 높이 확인 (검 높으면 반시계, 낮으면 시계 방향 안전지대 이동) -> 지름을 지나는 십자 직선 구역 회피 -> 본체 저스트 가드(G) 성공 후 내부 진입하여 무력화 (10초 추방 주기마다 입장 저가로 3번까지 재진입 가능)' },
                                    { line: 195, phase: '저저카저', hint: '백스텝 후 날려버리기 회피 -> 전방 빠른 저스트 가드(G) 2회 -> 전방 연속 찍기 후 큰 찍기 회피 -> 즉시 카운터 타격 -> 느린 저스트 가드(G)' },
                                    { line: 120, phase: '본체 찾기', hint: '다수의 분신 중 진짜 보스 판별하여 대응' },
                                    { line: 60, phase: '삼각 김밥 및 대난투 2차', hint: '맵에 생성되는 삼각 모양의 지정 안전 구역으로 이동\n[대난투 2칸 달성 시] 1관문(좌/우 화살표 엇박 + 찍기 저가) 패턴 수행 후 -> 정면 저스트 가드(G) 2회 연속 추가 수행' }
                                ]
                                for (const g of g2Nightmare) {
                                    const formattedHint = g.hint.replace(/\s*->\s*/g, '\n-> ')
                                    await PhaseGuide.create({ gateId: gate._id, ...g, hint: formattedHint })
                                }
                            }
                        }
                    }
                }
                
                console.log(`    Created Gates: ${createdGateNames.join(', ')} for ${difficulty.name}`)
            }
        }

        console.log('--- Dummy Seeding Completed ---')

    } catch (error) {
        console.error('Error in dummy seeding:', error)
    } finally {
        await mongoose.disconnect()
        process.exit(0)
    }
}

seedDummyData()
