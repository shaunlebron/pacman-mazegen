import sys,re

def print_map(contents):
  walls = {}
  xdim = {}
  ydim = {}
  for m in re.finditer('wall\((\d+),(\d+)\)', contents):
    walls[(int(m.group(1)),int(m.group(2)))] = True
  for m in re.finditer('xdim\((\d+)\)', contents):
    xdim[int(m.group(1))] = True
  for m in re.finditer('ydim\((\d+)\)', contents):
    ydim[int(m.group(1))] = True
  for y in range(max(ydim.keys())):
    for x in range(max(xdim.keys())):
      if (x+1,y+1) in walls:
        sys.stdout.write('|')
      else:
        sys.stdout.write('.')
    print ''

if __name__ == "__main__":
  for contents in re.split("Answer:", sys.stdin.read()):
    if not contents.strip():
      continue
    print ""
    print_map(contents)
