import pandas as pd
import sqlite3
import requests
import math
import random
import argparse
import json
from http.server import HTTPServer, BaseHTTPRequestHandler

class PremiumLottoEngine:
    def __init__(self, db_path="lotto_history.db"):
        self.db_path = db_path
        self.conn = sqlite3.connect(self.db_path)
        self.df = pd.DataFrame()
        
        # TODO: 추후 결제 모듈 연동 시 False로 막아두고 결제 성공 콜백에서 True로 전환합니다!
        self.is_premium_unlocked = True 
        
    def init_database(self):
        """1. 기존 데이터 로드 및 2. 동행복권 API 차분 동기화"""
        query = "SELECT * FROM lotto_results ORDER BY draw_no ASC"
        try:
            self.df = pd.read_sql(query, self.conn)
        except Exception as e:
            print(f"초기 DB가 없습니다. 🚀 (사유: {e})")
            self.df = pd.DataFrame(columns=["draw_no", "num1", "num2", "num3", "num4", "num5", "num6", "bonus"])
            
        last_draw = self.df["draw_no"].max() if not self.df.empty else 0
        if pd.isna(last_draw): last_draw = 0
        
        self._sync_latest_data(last_draw)
        
        # 동기화 후 최신 데이터 메모리(Pandas DataFrame) 갱신!
        try:
            self.df = pd.read_sql(query, self.conn)
        except Exception:
            pass
        
    def _sync_latest_data(self, last_draw):
        """동행복권 API를 호출하여 누락된 최신 회차를 SQLite에 채워 넣습니다."""
        current_draw = int(last_draw) + 1
        new_records = []
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
        
        while True:
            url = f"https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo={current_draw}"
            try:
                res = requests.get(url, headers=headers, timeout=5)
                
                if res.status_code != 200:
                    raise Exception(f"HTTP Status Code {res.status_code}")
                
                data = res.json()
                if data.get("returnValue") == "success":
                    record = {
                        "draw_no": data["drwNo"],
                        "num1": data["drwtNo1"],
                        "num2": data["drwtNo2"],
                        "num3": data["drwtNo3"],
                        "num4": data["drwtNo4"],
                        "num5": data["drwtNo5"],
                        "num6": data["drwtNo6"],
                        "bonus": data["bnusNo"]
                    }
                    new_records.append(record)
                    current_draw += 1
                else:
                    break  # 더 이상 최신 회차가 없는 경우 종료
                    
            except requests.exceptions.JSONDecodeError:
                print("\n⚠️ 서버 보안으로 최신 회차 동기화 실패. 기존 로컬 DB 데이터로 분석을 진행합니다.")
                break
            except Exception as e:
                print(f"\n⚠️ 서버 보안으로 최신 회차 동기화 실패. 기존 로컬 DB 데이터로 분석을 진행합니다. (사유: {e})")
                break
                
        if new_records:
            new_df = pd.DataFrame(new_records)
            new_df.to_sql("lotto_results", self.conn, if_exists="append", index=False)
            print(f"✅ {len(new_records)}건의 최신 회차 데이터를 성공적으로 동기화했습니다! (최신 회차: {current_draw-1}회)")
        else:
            if last_draw == 0:
                print("\n⚠️ 로컬 DB가 비어있어 임시 테스트 데이터를 1100회차 생성합니다.")
                import random
                for i in range(1, 1101):
                    nums = sorted(random.sample(range(1, 46), 6))
                    bonus = random.choice([n for n in range(1, 46) if n not in nums])
                    new_records.append({
                        "draw_no": i, "num1": nums[0], "num2": nums[1], "num3": nums[2],
                        "num4": nums[3], "num5": nums[4], "num6": nums[5], "bonus": bonus
                    })
                new_df = pd.DataFrame(new_records)
                new_df.to_sql("lotto_results", self.conn, if_exists="append", index=False)
            else:
                print(f"✅ 기존에 저장된 {last_draw}회차까지의 데이터를 활용하여 분석을 시작합니다.")

    def apply_premium_logic(self):
        """논문 기반: 벤포드 법칙 검증 + Offset(변위=2) 가중치 부여 로직"""
        if not self.is_premium_unlocked:
            return None
        
        # 최신 3개 회차만 가져옵니다 (Offset=2 패턴 분석용)
        recent_draws = self.df.tail(3)
        offset_2_numbers = []
        
        if len(recent_draws) >= 3:
            # 2회차 전(딱 한 회차를 건너뛴) 당첨 번호 추출
            target_draw = recent_draws.iloc[0] 
            offset_2_numbers = [int(target_draw[f"num{i}"]) for i in range(1, 7)]
        
        candidate = []
        max_attempts = 10000 
        
        for _ in range(max_attempts):
            pool = list(range(1, 46))
            
            # 논문 로직: Offset=2에 해당하는 번호가 나오면 가중치를 높입니다!
            weights = [1.8 if x in offset_2_numbers else 1.0 for x in pool]
            
            # 6개 번호 추출 (중복 제거)
            drawn = []
            while len(drawn) < 6:
                pick = random.choices(pool, weights=weights, k=1)[0]
                if pick not in drawn:
                    drawn.append(pick)
            drawn.sort()
            
            # 벤포드 법칙 로직: 6개 번호의 곱(y)의 첫 번째 숫자가 1~3인지 확인!
            # (자연의 무작위성을 띠는 로또 특성상 첫 자리가 1, 2인 확률이 지배적임)
            product = math.prod(drawn)
            first_digit = int(str(product)[0])
            
            if first_digit in [1, 2, 3]:
                candidate = drawn
                break
                
        # 조건에 맞는 번호를 찾았으면 반환, 만약 못 찾았으면 기본 난수로 던집니다!
        return candidate if candidate else sorted(random.sample(range(1, 46), 6))
        
    def apply_basic_logic(self):
        """기본 모드: 단순 무작위 난수 추출"""
        return sorted(random.sample(range(1, 46), 6))

class PremiumLottoGUI:
    def __init__(self, root):
        import tkinter as tk
        self.root = root
        self.root.title("안티그래비티 로또 - 프리미엄 통계 엔진 🚀")
        
        # 엔진 초기화 및 DB 동기화
        self.engine = PremiumLottoEngine()
        self.engine.init_database()
        
        self.result_label = tk.Label(root, text="번호를 추출해주세요!", font=("Helvetica", 20, "bold"), pady=30)
        self.result_label.pack()
        
        self.basic_btn = tk.Button(root, text="🎲 일반 무작위 추출", command=self.on_basic_click, font=("Helvetica", 14), width=25, pady=5)
        self.basic_btn.pack(pady=10)
        
        self.premium_btn = tk.Button(root, text="👑 프리미엄 통계 엔진 적용하기", command=self.on_premium_click, font=("Helvetica", 14, "bold"), bg="gold", width=25, pady=5)
        self.premium_btn.pack(pady=10)
        
    def on_basic_click(self):
        numbers = self.engine.apply_basic_logic()
        self.result_label.config(text=f"일반: {numbers}")

    def on_premium_click(self):
        # 프리미엄 기능 권한(과금 여부) 체크
        if not self.engine.is_premium_unlocked:
            from tkinter import messagebox
            messagebox.showwarning("결제 안내", "프리미엄 로직은 결제 후 이용 가능합니다!")
            return
            
        numbers = self.engine.apply_premium_logic()
        if numbers:
            self.result_label.config(text=f"👑 VIP 번호: {numbers}", fg="blue")
        else:
            self.result_label.config(text="추출 연산 시간 초과. 다시 시도해주세요.")

class PremiumAPIHandler(BaseHTTPRequestHandler):
    engine = None
    
    def do_OPTIONS(self):
        self.send_response(200, "ok")
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept')
        self.send_header('Access-Control-Max-Age', '86400')
        self.end_headers()
        
    def do_GET(self):
        if self.path == '/api/premium':
            if not PremiumAPIHandler.engine.is_premium_unlocked:
                self.send_error(403, "Premium logic not unlocked.")
                return
            
            try:
                numbers = PremiumAPIHandler.engine.apply_premium_logic()
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
                self.send_header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept')
                self.end_headers()
                self.wfile.write(json.dumps({'numbers': numbers}).encode('utf-8'))
            except Exception as e:
                print(f"Server Error in apply_premium_logic: {e}")
                self.send_error(500, f"Internal Server Error: {e}")
        else:
            self.send_error(404)

def run_api(port=8081):
    import os
    port = int(os.environ.get("PORT", port))
    engine = PremiumLottoEngine()
    engine.init_database()
if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="안티그래비티 로또 - 프리미엄 통계 엔진")
    parser.add_argument('--gui', action='store_true', help="Tkinter GUI 모드로 실행합니다.")
    parser.add_argument('--api', action='store_true', help="API 서버 모드로 실행합니다. (배포용)")
    parser.add_argument('--port', type=int, default=10000, help="API 서버 포트 (기본값: 10000)")
    
    args = parser.parse_args()
    
    if args.gui:
        import tkinter as tk
        root = tk.Tk()
        app = PremiumLottoGUI(root)
        root.mainloop()
    elif args.api:
        engine = PremiumLottoEngine()
        engine.init_database()
        PremiumAPIHandler.engine = engine
        
        server_address = ('', args.port)
        httpd = HTTPServer(server_address, PremiumAPIHandler)
        print(f"🚀 안티그래비티 로또 프리미엄 API 서버 가동 완료 (Port: {args.port})")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n서버를 종료합니다.")
            httpd.server_close()
    else:
        print("💡 사용법: 파이썬 스크립트 실행 시 옵션을 입력해주세요!")
        print("  GUI 모드 실행: python premium_lotto.py --gui")
        print("  API 서버 실행: python premium_lotto.py --api")
        print("  도움말 보기: python premium_lotto.py --help")
        
        # 내부 로직 테스트 용도로 엔진만 가볍게 돌려보는 코드
        print("\n[DB 동기화 테스트 진행 중...]")
        engine = PremiumLottoEngine()
        engine.init_database()
        print("테스트 완료.")
