import sys,re

def print_map(line):
  walls = {}
  blank = {}
  xdim = {}
  ydim = {}
  for m in re.finditer('wall\((\d+),(\d+)\)', line):
    walls[(int(m.group(1)),int(m.group(2)))] = True
  for m in re.finditer('blank\((\d+),(\d+)\)', line):
    blank[(int(m.group(1)),int(m.group(2)))] = True
  for m in re.finditer('xdim\((\d+)\)', line):
    xdim[int(m.group(1))] = True
  for m in re.finditer('ydim\((\d+)\)', line):
    ydim[int(m.group(1))] = True
  for y in range(max(ydim.keys())):
    for x in range(max(xdim.keys())):
      if (x+1,y+1) in walls:
        sys.stdout.write('|')
      elif (x+1,y+1) in blank:
        sys.stdout.write('_')
      else:
        sys.stdout.write('.')
    print ''

if __name__ == "__main__":
  lines = sys.stdin.readlines()
  for i,line in enumerate(lines):
    if line.startswith("Answer:"):
      print_map(lines[i+1])
      print ""
