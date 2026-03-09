import requests
import time
import sys
import argparse
import random
import threading
import subprocess
from queue import Queue
from database import save_loot
from proxy_handler import get_free_proxies, get_random_proxy
from payload_engine import test_parameters
from urllib.parse import urlparse, parse_qs

# List of real-world browser signatures
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Firefox/119.0",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1"
]

def get_stealth_headers():
    return {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        "DNT": "1", # Do Not Track request
        "Cache-Control": "max-age=0",
        "Sec-Ch-Ua": '"Google Chrome";v="119", "Chromium";v="119", "Not?A_Brand";v="24"',
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": '"Windows"',
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1"
    }

def full_scan(url):
    """Function to perform a full scan on the target."""
    print(f"RUNNING_FULL_SCAN|TARGET:{url}")
    port_scan(url)
    subdomain_enum(url)
    vulnerability_scan(url)

def vulnerability_scan(url):
    """Function to perform a vulnerability scan using nikto."""
    print(f"RUNNING_VULNERABILITY_SCAN|TARGET:{url}")
    try:
        # We need to extract the hostname from the URL for tools like nikto
        hostname = urlparse(url).hostname
        if not hostname:
            print(f"ERROR:Could not parse hostname from {url}")
            return

        # Using nikto to scan for vulnerabilities
        command = ["nikto", "-h", hostname]
        result = subprocess.run(command, capture_output=True, text=True, timeout=600) # 10-minute timeout
        print(f"VULNERABILITY_SCAN_OUTPUT|TARGET:{url}\n{result.stdout}\n{result.stderr}")

    except FileNotFoundError:
        print(f"ERROR:nikto is not installed or not in PATH. Please install it.")
    except subprocess.TimeoutExpired:
        print(f"ERROR:Timeout expired while running nikto on {url}.")
    except Exception as e:
        print(f"ERROR:An error occurred while running nikto: {e}")
    sys.stdout.flush()

def subdomain_enum(url):
    """Function to perform subdomain enumeration using assetfinder."""
    print(f"RUNNING_SUBDOMAIN_ENUM|TARGET:{url}")
    try:
        # We need to extract the hostname from the URL for tools like assetfinder
        hostname = urlparse(url).hostname
        if not hostname:
            print(f"ERROR:Could not parse hostname from {url}")
            return

        # Using assetfinder to find subdomains
        command = ["assetfinder", "--subs-only", hostname]
        result = subprocess.run(command, capture_output=True, text=True, timeout=300) # 5-minute timeout
        print(f"SUBDOMAIN_ENUM_OUTPUT|TARGET:{url}\n{result.stdout}\n{result.stderr}")

    except FileNotFoundError:
        print(f"ERROR:assetfinder is not installed or not in PATH. Please install it.")
    except subprocess.TimeoutExpired:
        print(f"ERROR:Timeout expired while running assetfinder on {url}.")
    except Exception as e:
        print(f"ERROR:An error occurred while running assetfinder: {e}")
    sys.stdout.flush()

def port_scan(url):
    """Function to perform a port scan using nmap."""
    print(f"RUNNING_PORT_SCAN|TARGET:{url}")
    try:
        # We need to extract the hostname from the URL for tools like nmap
        hostname = urlparse(url).hostname
        if not hostname:
            print(f"ERROR:Could not parse hostname from {url}")
            return

        # Using nmap to scan for open ports
        command = ["nmap", "-F", hostname] # Fast scan
        result = subprocess.run(command, capture_output=True, text=True, timeout=300) # 5-minute timeout
        print(f"PORT_SCAN_OUTPUT|TARGET:{url}\n{result.stdout}\n{result.stderr}")

    except FileNotFoundError:
        print(f"ERROR:nmap is not installed or not in PATH. Please install it.")
    except subprocess.TimeoutExpired:
        print(f"ERROR:Timeout expired while running nmap on {url}.")
    except Exception as e:
        print(f"ERROR:An error occurred while running nmap: {e}")
    sys.stdout.flush()

def run_kali_tool(tool, url):
    """Function to run a Kali tool using subprocess."""
    print(f"RUNNING_KALI_TOOL|TOOL:{tool}|TARGET:{url}")
    try:
        # We need to extract the hostname from the URL for tools like nmap
        hostname = urlparse(url).hostname
        if not hostname:
            print(f"ERROR:Could not parse hostname from {url}")
            return

        # Commands for different tools
        commands = {
            "nmap": ["nmap", "-A", hostname],
            "nikto": ["nikto", "-h", url],
            "whatweb": ["whatweb", "--no-errors", "-v", url],
            "searchsploit": ["searchsploit", "-w", hostname],
            "ffuf": ["ffuf", "-w", "/usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt", "-u", f"{url}/FUZZ"],
            "sqlmap": ["sqlmap", "-u", url, "--forms", "--batch"]
        }
        
        command = commands.get(tool)
        
        if command:
            # Using subprocess.run to execute the command
            result = subprocess.run(command, capture_output=True, text=True, timeout=300) # 5-minute timeout
            print(f"KALI_TOOL_OUTPUT|TOOL:{tool}|TARGET:{url}\n{result.stdout}\n{result.stderr}")
        else:
            print(f"ERROR:Unknown Kali tool: {tool}")

    except FileNotFoundError:
        print(f"ERROR:{tool} is not installed or not in PATH. Please install it.")
    except subprocess.TimeoutExpired:
        print(f"ERROR:Timeout expired while running {tool} on {url}.")
    except Exception as e:
        print(f"ERROR:An error occurred while running {tool}: {e}")
    sys.stdout.flush()

def check_headers(headers):
    results = []
    # Sirf wahi headers check karo jo security ke liye standard hain
    check_list = [
        "Content-Security-Policy", 
        "Strict-Transport-Security", 
        "X-Content-Type-Options", 
        "X-Frame-Options", 
        "Referrer-Policy"
    ]
    
    # Normalize headers for case-insensitive matching
    h = {k.lower(): v for k, v in headers.items()}
    
    for header in check_list:
        header_lower = header.lower()
        if header_lower in h:
            # Agar header present hai, toh ye accurate hai
            results.append({"name": header, "status": "SAFE", "value": h[header_lower]})
        else:
            # Agar missing hai, toh ye reality hai, ise report karo
            results.append({"name": header, "status": "VULNERABLE", "value": "MISSING"})
    return results

def check_sqli(url, headers=None, proxies=None):
    # Common payloads to trigger an error
    payloads = ["'", '"', "';--", '")--']
    vulnerable = False
    
    for payload in payloads:
        test_url = f"{url}{payload}"
        try:
            response = requests.get(test_url, timeout=5, headers=headers, proxies=proxies)
            # Agar response mein SQL error keywords hain, toh vulnerable hai
            errors = ["sql syntax", "mysql_fetch", "ora-01756", "sqlite3.error"]
            if any(error in response.text.lower() for error in errors):
                vulnerable = True
                break
        except requests.exceptions.RequestException as e:
            # Silently ignoring all exceptions is bad. At least log request errors.
            print(f"ERROR:SQLi check failed for {test_url}|REASON:{e}")
            
    if vulnerable:
        print(f"SQLI_VULN:TRUE|URL:{url}")
        save_loot(url, "200 OK", "HIGH")
    else:
        print(f"SQLI_VULN:FALSE|URL:{url}")
        save_loot(url, "200 OK", "SECURE")
    sys.stdout.flush()

def scan_worker(q, base_url, stealth, active_proxies, progress_tracker, kali_tools=None):
    if kali_tools is None:
        kali_tools = []
    while not q.empty():
        path = q.get()
        # Clean path
        clean_path = path.lstrip('/')
        url = f"{base_url.rstrip('/')}/{clean_path}"
        
        try:
            headers = None
            proxies = None
            
            if stealth:
                headers = get_stealth_headers()
                proxies = get_random_proxy(active_proxies)
                if proxies:
                    print(f"PROXY_IN_USE:{proxies['http']}")
                    sys.stdout.flush()
                # Har request ke beech mein random delay (0.5 to 1.5 seconds)
                time.sleep(random.uniform(0.5, 1.5))
            else:
                headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
            
            response = requests.get(url, timeout=5, allow_redirects=True, headers=headers, proxies=proxies)
            if response.status_code == 200:
                print(f"FOUND:{url}")
                header_results = check_headers(response.headers)
                for res in header_results:
                    if res['status'] == "VULNERABLE":
                        print(f"VULN_DETECTED|TARGET:{url}|TYPE:Missing Header|NAME:{res['name']}|STATUS:VULNERABLE")
                sys.stdout.flush()
                
                # Run Kali tools if any are specified
                for tool in kali_tools:
                    run_kali_tool(tool, url)
                    
                # Check for SQLi
                check_sqli(url, headers=headers, proxies=proxies)
                
                # Extract and test parameters
                parsed_url = urlparse(url)
                params = parse_qs(parsed_url.query)
                # Convert list values to single values for test_parameters
                flat_params = {k: v[0] for k, v in params.items()}
                
                if flat_params:
                    test_parameters(url.split('?')[0], flat_params, headers=headers, proxies=proxies)
                else:
                    # Test common parameters even if not present
                    common_params = {'id': '1', 'page': 'home', 'file': 'test', 'name': 'admin'}
                    test_parameters(url, common_params, headers=headers, proxies=proxies)
        except requests.exceptions.RequestException as e:
            # It's better to catch specific exceptions and log them.
            print(f"ERROR:Scan failed for {url}|REASON:{e}")
        
        progress_tracker['count'] += 1
        current_progress = int((progress_tracker['count'] / progress_tracker['total']) * 100)
        print(f"PROGRESS:{current_progress}")
        sys.stdout.flush()
        q.task_done()

def start_discovery(target_url, wordlist_file, stealth=False, kali_tools=None):
    if kali_tools is None:
        kali_tools = []
    try:
        with open(wordlist_file, 'r') as f:
            paths = [line.strip() for line in f.readlines()]
    except Exception as e:
        print(f"ERROR:Could not read wordlist: {e}")
        sys.stdout.flush()
        return
    
    total = len(paths)
    if total == 0:
        return

    # Ensure target_url has protocol for requests
    if not target_url.startswith(('http://', 'https://')):
        base_url = f"http://{target_url}"
    else:
        base_url = target_url

    print(f"[*] Starting parallel scan on {base_url} (Stealth: {stealth})...")
    sys.stdout.flush()

    active_proxies = []
    if stealth:
        print("[*] Fetching fresh proxies for Ghost Mode...")
        sys.stdout.flush()
        active_proxies = get_free_proxies()
        print(f"[*] Found {len(active_proxies)} proxies.")
        sys.stdout.flush()

    q = Queue()
    for path in paths:
        q.put(path)

    progress_tracker = {'count': 0, 'total': total}
    
    # 10 Threads ek saath chalenge
    threads = []
    num_threads = 10 if not stealth else 3 # Stealth mode mein kam threads taaki block na ho
    
    for i in range(num_threads):
        t = threading.Thread(target=scan_worker, args=(q, base_url, stealth, active_proxies, progress_tracker, kali_tools))
        t.daemon = True
        t.start()
        threads.append(t)
    
    q.join()
    print("[+] Scan Completed.")
    sys.stdout.flush()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--target", required=True)
    parser.add_argument("--wordlist", required=True)
    parser.add_argument("--stealth", action="store_true")
    parser.add_argument("--kali", help="Comma-separated list of Kali tools to run (e.g., nmap,nikto)")
    parser.add_argument("--port-scan", action="store_true", help="Perform a port scan on the target")
    parser.add_argument("--subdomain-enum", action="store_true", help="Perform subdomain enumeration on the target")
    parser.add_argument("--vulnerability-scan", action="store_true", help="Perform a vulnerability scan on the target")
    parser.add_argument("--full-scan", action="store_true", help="Perform a full scan on the target")
    parser.add_argument("--output", help="File to save the output")
    args = parser.parse_args()

    if args.output:
        sys.stdout = open(args.output, "w")
    
    if args.port_scan:
        port_scan(args.target)

    if args.subdomain_enum:
        subdomain_enum(args.target)

    if args.vulnerability_scan:
        vulnerability_scan(args.target)

    if args.full_scan:
        full_scan(args.target)

    kali_tools = []
    if args.kali:
        kali_tools = args.kali.split(',')

    start_discovery(args.target, args.wordlist, args.stealth, kali_tools)

    if args.output:
        sys.stdout.close()
