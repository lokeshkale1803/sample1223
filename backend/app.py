from io import BytesIO
from flask import Flask, request, render_template, jsonify, redirect, url_for, session
import base64
import os
import uuid
import json
from dotenv import load_dotenv
from web3 import Web3
from eth_account import Account

app = Flask(__name__)
LIC_STR = '' 
app.secret_key = 'your_secret_key'

# Load Environment Variables
load_dotenv()
RPC_URL = os.getenv('RPC_URL')
PRIVATE_KEY = os.getenv('PRIVATE_KEY')

if not RPC_URL or not PRIVATE_KEY:
    print("WARNING: Missing RPC_URL or PRIVATE_KEY in .env file", flush=True)

w3 = Web3(Web3.HTTPProvider(RPC_URL))
admin_account = Account.from_key(PRIVATE_KEY) if PRIVATE_KEY else None

# Load ABI
try:
    with open(os.path.join(os.path.dirname(__file__), 'abi.json'), 'r') as f:
        CONTRACT_ABI = json.load(f)
except Exception as e:
    print(f"Error loading ABI: {e}")
    CONTRACT_ABI = []

ACTIVE_CONTRACT_ADDRESS = None

# Data storage for display follow up pages
input_data = {}
response_data = {}
response_data_1 = {}
response_data_2 = {}
match_score = {}

IS_VOTING_ACTIVE = False

def TranslateErrorNumber(ErrorNumber):
    match ErrorNumber:
            # 0 - 999 - Comes from SgFplib.h
            # 1,000 - 9,999 - SGIBioSrv errors 
            # 10,000 - 99,999 license errors
            case 3:
                return "Failure to reach SecuGen Fingerprint Scanner"
        
            case 51:
                return "System file load failure";
            case 52:
                return "Sensor chip initialization failed";
            case 53:
                return "Device not found";
            case 54:
                return "Fingerprint image capture timeout";
            case 55:
                return "No device available";
            case 56:
                return "Driver load failed";
            case 57:
                return "Wrong Image";
            case 58:
                return "Lack of bandwidth";
            case 59:
                return "Device Busy";
            case 60:
                return "Cannot get serial number of the device";
            case 61:
                return "Unsupported device";
            case 63:
                return "SgiBioSrv didn't start; Try image capture again";
            case _:
                return "Unknown error code or Update code to reflect latest result";

@app.route('/')
def home():
    return render_template('home.html')

# First page: Submit predefined data and display image from response
@app.route('/SimpleScan', methods=['GET', 'POST'])
def SimpleScan():
    input_data['SecuGen_Lic'] = LIC_STR
    input_data['Timeout'] = 10000
    input_data['Quality'] = 50
    input_data['Fake_Detect'] = 0
    input_data['TemplateFormat'] = 'ISO'
    input_data['ImageWSQRate'] = '0.75'
    # 5/15/24 -> At this time, only ImageWSQRate only has 2 options:  0.75 or 2.25
    # input_data['ImageWSQRate'] = '2.25'
    input_data['FakeDetect'] = '0'
    return render_template('SimpleScan.html', user_input=input_data)

# Display_Image page: Form to input data, send, and display image from response
@app.route('/Display_Image', methods=['GET', 'POST'])
def DisplayImage():
    ErrorNumber = int(request.form.get('ErrorCode'))
    if ErrorNumber > 0:
        return render_template('error.html', error=ErrorNumber, errordescription=TranslateErrorNumber(ErrorNumber))

    input_data['Timeout'] = request.form.get('timeout')
    input_data['Quality'] = request.form.get('quality')
    input_data['Fake_Detect'] = request.form.get('fake_detect')
    input_data['TemplateFormat'] = request.form.get('template_format')
    input_data['ImageWSQRate'] = request.form.get('imagewsqrate')

    # Extract data coming from the external API
    response_data['Manufacturer'] = request.form.get('Manufacturer')
    response_data['Model'] = request.form.get('Model')
    response_data['SerialNumber'] = request.form.get('SerialNumber')
    response_data['ImageWidth'] = request.form.get('ImageWidth')
    response_data['ImageHeight'] = request.form.get('ImageHeight')
    response_data['ImageDPI'] = request.form.get('ImageDPI')
    response_data['ImageQuality'] = request.form.get('ImageQuality')
    response_data['NFIQ'] = request.form.get('NFIQ')
    response_data['TemplateBase64'] = request.form.get('TemplateBase64')
    response_data['WSQImageSize'] = request.form.get('WSQImageSize')
    response_data['WSQImage'] = request.form.get('WSQImage')
    response_data['BMPBase64'] = request.form.get('BMPBase64')    
    return render_template('display_image.html', metadata=response_data, user_input=input_data)

# Second page: Form to input data, send, and display image from response
@app.route('/AdvancedScan', methods=['GET', 'POST'])
def AdvancedScan():
    input_data['Display_Input_Params'] = 0
    input_data['SecuGen_Lic'] = LIC_STR
    input_data['ImageWSQRate'] = '2.25'

    return render_template('AdvancedScan.html', user_input=input_data)

# Third page: Multiple actions to submit data and display images
@app.route('/scan1', methods=['GET', 'POST'])
def scan1():
    input_data['SecuGen_Lic'] = LIC_STR
    input_data['Timeout'] = 10000
    input_data['Quality'] = 50
    input_data['TemplateFormat'] = 'ISO'
    input_data['ImageWSQRate'] = '0.75'
    return render_template('scan1.html', user_input=input_data)

@app.route('/scan2', methods=['GET', 'POST'])
def scan2():
    ErrorNumber = int(request.form.get('ErrorCode'))
    if ErrorNumber > 0:
        return render_template('error.html', error=ErrorNumber, errordescription=TranslateErrorNumber(ErrorNumber))
    
    response_data_1['template'] = request.form.get('TemplateBase64')
    response_data_1['BMPBase64'] = request.form.get('BMPBase64')

    return render_template('scan2.html', user_input=input_data, metadata1=response_data_1)

@app.route('/compare', methods=['GET', 'POST'])
def compare():
    ErrorNumber = int(request.form.get('ErrorCode'))
    if ErrorNumber > 0:
        return render_template('error.html', error=ErrorNumber, errordescription=TranslateErrorNumber(ErrorNumber))
    
    response_data_2['template'] = request.form.get('TemplateBase64')
    response_data_2['BMPBase64'] = request.form.get('BMPBase64')

    return render_template('compare.html', user_input=input_data, metadata1=response_data_1, metadata2=response_data_2, MatchQuality=100)

@app.route('/matchscore', methods=['GET', 'POST'])
def matchscore():
    ErrorNumber = int(request.form.get('ErrorCode'))
    if ErrorNumber > 0:
        return render_template('error.html', error=ErrorNumber, errordescription=TranslateErrorNumber(ErrorNumber))
    
    match_score['matchingscore'] = int(request.form.get('MatchingScore'))
    match_score['userquality'] = int(request.form.get('userquality'))
    match_message = 'MATCHED. Score is: ' + str(match_score['matchingscore']) if match_score['matchingscore'] > match_score['userquality'] else 'NOT MATCHED. Score is: ' + str(match_score['matchingscore'])
    return render_template('match_score.html', user_input=input_data, metadata1=response_data_1, metadata2=response_data_2, match_score=match_message)

import mysql.connector

def get_db_connection():
    return mysql.connector.connect(
        host="127.0.0.1",
        user="root",
        password="admin",
        database="voting_system"
    )

@app.route('/api/voter/<voter_id>', methods=['GET'])
def get_voter(voter_id):
    try:
        conn = get_db_connection()
        c = conn.cursor()
        c.execute('SELECT fingerprint_template, iris_template, fingerprint_hash, iris_hash FROM voters WHERE voter_id=%s', (voter_id,))
        row = c.fetchone()
        c.close()
        conn.close()
        if row:
            return jsonify({
                "status": "exists", 
                "fingerprint_template": row[0], 
                "iris_template": row[1],
                "fingerprint_hash": row[2],
                "iris_hash": row[3]
            })
        return jsonify({"status": "not_found"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/admin/voter', methods=['POST'])
def create_voter():
    voter_id = request.form.get('voter_id')
    name = request.form.get('name') or None
    fingerprint_template = request.form.get('fingerprint_template') or None
    fingerprint_hash = request.form.get('fingerprint_hash') or None
    iris_template = request.form.get('iris_template') or None
    iris_hash = request.form.get('iris_hash') or None
    
    try:
        conn = get_db_connection()
        c = conn.cursor()
        
        # Check if already exists
        c.execute('SELECT voter_id FROM voters WHERE voter_id=%s', (voter_id,))
        if c.fetchone():
            c.close()
            conn.close()
            return jsonify({"status": "error", "message": "Voter ID already registered"}), 400
            
        c.execute('INSERT INTO voters (voter_id, name, fingerprint_template, fingerprint_hash, iris_template, iris_hash) VALUES (%s, %s, %s, %s, %s, %s)', 
                  (voter_id, name, fingerprint_template, fingerprint_hash, iris_template, iris_hash))
        conn.commit()
        c.close()
        conn.close()
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/voter', methods=['POST'])
def save_voter():
    voter_id = request.form.get('voter_id')
    fingerprint_template = request.form.get('fingerprint_template')
    fingerprint_hash = request.form.get('fingerprint_hash')
    iris_template = request.form.get('iris_template')
    iris_hash = request.form.get('iris_hash')
    
    try:
        conn = get_db_connection()
        c = conn.cursor()
        
        # Check if voter exists
        c.execute('SELECT voter_id FROM voters WHERE voter_id=%s', (voter_id,))
        row = c.fetchone()
        
        if not row:
            c.close()
            conn.close()
            return jsonify({"status": "error", "message": "Voter ID not registered in database"}), 400
            
        if fingerprint_template:
            c.execute('UPDATE voters SET fingerprint_template=%s, fingerprint_hash=%s WHERE voter_id=%s', (fingerprint_template, fingerprint_hash, voter_id))
        if iris_template:
            c.execute('UPDATE voters SET iris_template=%s, iris_hash=%s WHERE voter_id=%s', (iris_template, iris_hash, voter_id))
            
        conn.commit()
        c.close()
        conn.close()
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/voters', methods=['GET'])
def get_all_voters():
    try:
        conn = get_db_connection()
        c = conn.cursor()
        c.execute('SELECT voter_id, name, fingerprint_template, iris_template FROM voters')
        rows = c.fetchall()
        c.close()
        conn.close()
        
        import hashlib
        voters_list = []
        for row in rows:
            voter_id = row[0]
            voters_list.append({
                "voter_id": voter_id,
                "name": row[1] or "N/A",
                "has_fingerprint": bool(row[2]),
                "has_iris": bool(row[3]),
                "has_voted": False # Check via contract directly instead of local DB
            })
        return jsonify({"status": "success", "voters": voters_list})
    except Exception as e:
        print("GET /api/voters ERROR:", e, flush=True)
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/voter/<voter_id>', methods=['DELETE'])
def delete_voter(voter_id):
    try:
        conn = get_db_connection()
        c = conn.cursor()
        c.execute('DELETE FROM voters WHERE voter_id=%s', (voter_id,))
        conn.commit()
        c.close()
        conn.close()
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# Candidates API Routes
@app.route('/api/candidates', methods=['GET', 'POST'])
def candidates_api():
    if request.method == 'GET':
        try:
            conn = get_db_connection()
            c = conn.cursor()
            c.execute('SELECT id, name, party, photo_path, party_logo_path, is_nota FROM candidates')
            rows = c.fetchall()
            c.close()
            conn.close()
            
            candidates_list = []
            for row in rows:
                candidates_list.append({
                    "id": row[0],
                    "name": row[1],
                    "party": row[2],
                    "photo_path": f"http://127.0.0.1:5000/{row[3]}" if row[3] else "",
                    "party_logo_path": f"http://127.0.0.1:5000/{row[4]}" if row[4] else "",
                    "isNOTA": bool(row[5])
                })
            return jsonify({"status": "success", "candidates": candidates_list})
        except Exception as e:
            print("GET /api/candidates ERROR:", e, flush=True)
            return jsonify({"status": "error", "message": str(e)}), 500
    
    if request.method == 'POST':
        try:
            name = request.json.get('name')
            party = request.json.get('party')
            photo_b64 = request.json.get('photo_path', '')
            logo_b64 = request.json.get('party_logo_path', '')
            is_nota = request.json.get('is_nota', False)
            cand_id = request.json.get('id') or str(uuid.uuid4())[:8]

            def save_b64_image(b64_str):
                if not b64_str or not b64_str.startswith('data:image'):
                    return ""
                header, encoded = b64_str.split(',', 1)
                ext = header.split(';')[0].split('/')[1]
                filename = f"{uuid.uuid4()}.{ext}"
                filepath = os.path.join('static', 'candidates', filename)
                with open(filepath, "wb") as f:
                    f.write(base64.b64decode(encoded))
                return filepath.replace('\\', '/')

            photo_path = save_b64_image(photo_b64)
            logo_path = save_b64_image(logo_b64)

            conn = get_db_connection()
            c = conn.cursor()
            c.execute('''
                INSERT INTO candidates (id, name, party, photo_path, party_logo_path, is_nota)
                VALUES (%s, %s, %s, %s, %s, %s)
            ''', (cand_id, name, party, photo_path, logo_path, is_nota))
            conn.commit()
            c.close()
            conn.close()
            
            return jsonify({"status": "success", "message": "Candidate added"})
        except Exception as e:
            print("POST /api/candidates ERROR:", e, flush=True)
            return jsonify({"status": "error", "message": str(e)}), 500

# Blockchain API Routes
@app.route('/api/blockchain', methods=['GET'])
def get_blockchain():
    try:
        return jsonify({
            "status": "success", 
            "blockchain": blockchain.chain
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/settings/voting_active', methods=['GET', 'POST'])
def handle_voting_active():
    global IS_VOTING_ACTIVE
    if request.method == 'POST':
        status = request.form.get('active', 'false').lower() == 'true'
        IS_VOTING_ACTIVE = status
        
        # Attempt to call startElection or endElection on the smart contract
        if ACTIVE_CONTRACT_ADDRESS and admin_account:
            try:
                contract = w3.eth.contract(address=ACTIVE_CONTRACT_ADDRESS, abi=CONTRACT_ABI)
                nonce = w3.eth.get_transaction_count(admin_account.address, 'pending')
                
                if status:
                    txn = contract.functions.startElection().build_transaction({
                        'from': admin_account.address,
                        'nonce': nonce,
                        'gas': 2000000,
                        'gasPrice': w3.eth.gas_price
                    })
                else:
                    txn = contract.functions.endElection().build_transaction({
                        'from': admin_account.address,
                        'nonce': nonce,
                        'gas': 2000000,
                        'gasPrice': w3.eth.gas_price
                    })
                    
                signed_txn = w3.eth.account.sign_transaction(txn, private_key=PRIVATE_KEY)
                w3.eth.send_raw_transaction(signed_txn.raw_transaction)
                print(f"Blockchain synced: {'startElection' if status else 'endElection'} executed.")
            except Exception as e:
                # If the contract is already active/ended or another error occurs, we just log it and proceed locally.
                print("Blockchain election state sync failed (might already be in desired state):", e)
                
        return jsonify({"status": "success", "isVotingActive": IS_VOTING_ACTIVE, "contractAddress": ACTIVE_CONTRACT_ADDRESS})
    else:
        return jsonify({"status": "success", "isVotingActive": IS_VOTING_ACTIVE, "contractAddress": ACTIVE_CONTRACT_ADDRESS})

@app.route('/api/settings/contract_address', methods=['POST'])
def set_contract_address():
    global ACTIVE_CONTRACT_ADDRESS
    address = request.json.get('address')
    if not address or not w3.is_address(address):
        return jsonify({"status": "error", "message": "Invalid contract address"}), 400
    ACTIVE_CONTRACT_ADDRESS = w3.to_checksum_address(address)
    return jsonify({"status": "success", "address": ACTIVE_CONTRACT_ADDRESS})

@app.route('/api/cast_vote', methods=['POST'])
def cast_vote():
    voter_id = request.form.get('voter_id')
    candidate_id = request.form.get('candidate')
    
    if not voter_id or not candidate_id:
        return jsonify({"status": "error", "message": "Missing voter_id or candidate"}), 400
        
    if not ACTIVE_CONTRACT_ADDRESS or not admin_account:
        return jsonify({"status": "error", "message": "Blockchain connection not configured"}), 500
        
    try:
        # Create hashed voter id locally using Web3.keccak
        hashed_voter_id = Web3.keccak(text=voter_id)
        
        contract = w3.eth.contract(address=ACTIVE_CONTRACT_ADDRESS, abi=CONTRACT_ABI)
        
        # Check if already voted using blockchain
        has_voted = contract.functions.hasVoted(hashed_voter_id).call()
        if has_voted:
            return jsonify({"status": "error", "message": "already_voted"}), 400

        try:
            cand_id_int = int(candidate_id)
        except ValueError:
            return jsonify({"status": "error", "message": "Candidate must be an integer ID"}), 400

        nonce = w3.eth.get_transaction_count(admin_account.address, 'pending')
        
        # Build the transaction
        txn = contract.functions.castVote(hashed_voter_id, cand_id_int).build_transaction({
            'from': admin_account.address,
            'nonce': nonce,
            'gas': 2000000,
            'gasPrice': w3.eth.gas_price
        })
        
        # Sign the transaction
        signed_txn = w3.eth.account.sign_transaction(txn, private_key=PRIVATE_KEY)
        
        # Send it
        tx_hash = w3.eth.send_raw_transaction(signed_txn.raw_transaction)
        
        return jsonify({
            "status": "success", 
            "block_hash": tx_hash.hex()
        })
    except Exception as e:
        print("Blockchain Error:", e, flush=True)
        return jsonify({"status": "error", "message": str(e)}), 500

# Add CORS to allow requests from the frontend index.html
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

if __name__ == '__main__':
    app.run(debug=True)
